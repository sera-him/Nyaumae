from __future__ import annotations

import argparse
import json
import math
import random
import re
import subprocess
import sys
import tempfile
import time
from collections import deque
from pathlib import Path

DIRS = ((0, 1), (1, 0), (0, -1), (-1, 0))
FORWARD_NEIGHBORS = ((0, 1), (1, -1), (1, 0), (1, 1))
Z3_EXE = Path(r"C:\tmp\threeholes-z3\bin\z3.exe")


def exact_sum(indices: list[int], k: int) -> str:
    terms = " ".join(f"(ite x_{index} 1 0)" for index in indices)
    return f"(assert (= (+ {terms}) {k}))"


def build_smt(n: int, k: int, regions: list[int], known: list[int] | None) -> str:
    lines = ["(set-logic QF_LIA)"]
    lines.extend(f"(declare-fun x_{index} () Bool)" for index in range(n * n))
    for row in range(n):
        lines.append(exact_sum([row * n + col for col in range(n)], k))
    for col in range(n):
        lines.append(exact_sum([row * n + col for row in range(n)], k))
    for region in range(n):
        members = [index for index, value in enumerate(regions) if value == region]
        lines.append(exact_sum(members, k))

    for row in range(n):
        for col in range(n):
            here = row * n + col
            for dr, dc in FORWARD_NEIGHBORS:
                other_row = row + dr
                other_col = col + dc
                if 0 <= other_row < n and 0 <= other_col < n:
                    other = other_row * n + other_col
                    lines.append(f"(assert (not (and x_{here} x_{other})))")

    if known is not None:
        missing_known_hole = " ".join(
            f"(not x_{index})" for index, value in enumerate(known) if value
        )
        lines.append(f"(assert (or {missing_known_hole}))")
    lines.append("(check-sat)")
    lines.append(
        "(get-value (" + " ".join(f"x_{index}" for index in range(n * n)) + "))"
    )
    return "\n".join(lines) + "\n"


def run_smt(
    n: int,
    k: int,
    regions: list[int],
    known: list[int] | None,
    timeout_ms: int,
) -> tuple[str, list[int] | None]:
    smt = build_smt(n, k, regions, known)
    path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".smt2", encoding="utf-8", delete=False, dir=r"C:\tmp"
        ) as handle:
            handle.write(smt)
            path = handle.name
        result = subprocess.run(
            [str(Z3_EXE), f"-T:{max(1, math.ceil(timeout_ms / 1000))}", "-smt2", path],
            capture_output=True,
            text=True,
            timeout=max(5, math.ceil(timeout_ms / 1000) + 5),
            check=False,
        )
    except subprocess.TimeoutExpired:
        return "timeout", None
    finally:
        if path:
            Path(path).unlink(missing_ok=True)

    output = result.stdout.strip()
    first_line = output.splitlines()[0] if output else ""
    if first_line == "unsat":
        return "unique" if known is not None else "unsat", None
    if first_line != "sat":
        return "timeout", None
    values = [0] * (n * n)
    for index, value in re.findall(r"\(x_(\d+)\s+(true|false)\)", output):
        values[int(index)] = 1 if value == "true" else 0
    return "multiple" if known is not None else "sat", values


def solve_one(n: int, k: int, regions: list[int], timeout_ms: int) -> list[int] | None:
    status, solution = run_smt(n, k, regions, None, timeout_ms)
    return solution if status == "sat" else None


def affine_solution(n: int, k: int) -> list[int] | None:
    step = 2 * k + 1
    while math.gcd(step, n) != 1:
        step += 1
    direct = [0] * (n * n)
    for row in range(n):
        for offset in range(k):
            direct[row * n + ((row * step + 2 * offset) % n)] = 1
    if sum(direct) == n * k:
        safe = True
        for index, value in enumerate(direct):
            if not value:
                continue
            row, col = divmod(index, n)
            if any(direct[other] for other in neighbors(index, n)):
                safe = False
                break
            for dr, dc in ((-1, -1), (-1, 1), (1, -1), (1, 1)):
                other_row, other_col = row + dr, col + dc
                if 0 <= other_row < n and 0 <= other_col < n and direct[other_row * n + other_col]:
                    safe = False
                    break
            if not safe:
                break
        if safe and all(
            sum(direct[row * n + col] for row in range(n)) == k
            for col in range(n)
        ):
            return direct

    for shift in range(1, n):
        if math.gcd(shift, n) != 1:
            continue
        columns = [[(offset + row * shift) % n for row in range(n)] for offset in range(n)]
        self_ok = [
            all(abs(columns[offset][row] - columns[offset][row + 1]) > 1 for row in range(n - 1))
            for offset in range(n)
        ]
        compatible = [[False] * n for _ in range(n)]
        for a in range(n):
            if not self_ok[a]:
                continue
            for b in range(a + 1, n):
                if not self_ok[b]:
                    continue
                ok = all(abs(columns[a][row] - columns[b][row]) > 1 for row in range(n))
                ok = ok and all(
                    abs(columns[a][row] - columns[b][row + 1]) > 1
                    and abs(columns[b][row] - columns[a][row + 1]) > 1
                    for row in range(n - 1)
                )
                compatible[a][b] = compatible[b][a] = ok

        chosen: list[int] = []

        def choose(start: int) -> bool:
            if len(chosen) == k:
                return True
            for offset in range(start, n):
                if self_ok[offset] and all(compatible[offset][other] for other in chosen):
                    chosen.append(offset)
                    if choose(offset + 1):
                        return True
                    chosen.pop()
            return False

        if not choose(0):
            continue
        holes = [0] * (n * n)
        for row in range(n):
            for offset in chosen:
                holes[row * n + columns[offset][row]] = 1
        return holes
    return None


def find_alternative(
    n: int,
    k: int,
    regions: list[int],
    known: list[int],
    timeout_ms: int,
) -> tuple[str, list[int] | None]:
    return run_smt(n, k, regions, known, timeout_ms)


def neighbors(index: int, n: int) -> list[int]:
    row, col = divmod(index, n)
    out: list[int] = []
    for dr, dc in DIRS:
        other_row = row + dr
        other_col = col + dc
        if 0 <= other_row < n and 0 <= other_col < n:
            out.append(other_row * n + other_col)
    return out


def region_connected(regions: list[int], n: int, region: int, expected: int) -> bool:
    try:
        start = regions.index(region)
    except ValueError:
        return False
    seen = {start}
    queue = deque([start])
    while queue:
        index = queue.popleft()
        for other in neighbors(index, n):
            if other not in seen and regions[other] == region:
                seen.add(other)
                queue.append(other)
    return len(seen) == expected


def try_transfer(
    regions: list[int],
    sizes: list[int],
    known: list[int],
    index: int,
    receiver: int,
    n: int,
    minimum_size: int,
    maximum_size: int,
) -> bool:
    donor = regions[index]
    if donor == receiver or known[index]:
        return False
    if sizes[donor] - 1 < minimum_size or sizes[receiver] + 1 > maximum_size:
        return False

    regions[index] = receiver
    sizes[donor] -= 1
    sizes[receiver] += 1
    if region_connected(regions, n, donor, sizes[donor]):
        return True

    regions[index] = donor
    sizes[donor] += 1
    sizes[receiver] -= 1
    return False


def try_swap(
    regions: list[int],
    sizes: list[int],
    known: list[int],
    first: int,
    second: int,
    n: int,
) -> bool:
    region_a = regions[first]
    region_b = regions[second]
    if region_a == region_b or known[first] != known[second]:
        return False

    regions[first] = region_b
    regions[second] = region_a
    if (
        region_connected(regions, n, region_a, sizes[region_a])
        and region_connected(regions, n, region_b, sizes[region_b])
    ):
        return True

    regions[first] = region_a
    regions[second] = region_b
    return False


def random_swap(
    rng: random.Random,
    regions: list[int],
    sizes: list[int],
    known: list[int],
    n: int,
) -> bool:
    first_cells = list(range(n * n))
    rng.shuffle(first_cells)
    for first in first_cells:
        region_a = regions[first]
        adjacent_regions = list({
            regions[other]
            for other in neighbors(first, n)
            if regions[other] != region_a
        })
        rng.shuffle(adjacent_regions)
        for region_b in adjacent_regions:
            second_cells = [
                second
                for second in range(n * n)
                if regions[second] == region_b
                and known[second] == known[first]
                and any(regions[other] == region_a for other in neighbors(second, n))
            ]
            rng.shuffle(second_cells)
            for second in second_cells:
                if try_swap(regions, sizes, known, first, second, n):
                    return True
    return False


def grow_regions_around_solution(
    rng: random.Random,
    known: list[int],
    n: int,
    k: int,
    max_attempts: int = 500,
) -> tuple[list[int], list[int]]:
    total = n * n
    hole_indices = [index for index, value in enumerate(known) if value]

    for _ in range(max_attempts):
        regions = [-1] * total
        sizes = [0] * n
        hole_counts = [0] * n
        frontiers = [set() for _ in range(n)]
        seeds = [rng.choice(hole_indices)]
        while len(seeds) < n:
            remaining = [index for index in hole_indices if index not in seeds]
            best_distance = max(
                min(
                    abs(index // n - seed // n) + abs(index % n - seed % n)
                    for seed in seeds
                )
                for index in remaining
            )
            farthest = [
                index
                for index in remaining
                if min(
                    abs(index // n - seed // n) + abs(index % n - seed % n)
                    for seed in seeds
                ) == best_distance
            ]
            seeds.append(rng.choice(farthest))

        def add_frontier(region: int, index: int) -> None:
            for other in neighbors(index, n):
                if regions[other] == -1:
                    frontiers[region].add(other)

        for region, seed in enumerate(seeds):
            regions[seed] = region
            sizes[region] = 1
            hole_counts[region] = 1
        for region, seed in enumerate(seeds):
            add_frontier(region, seed)

        assigned = n
        failed = False
        while assigned < total:
            choices: list[tuple[int, list[int]]] = []
            weights: list[float] = []
            for region in range(n):
                valid: list[int] = []
                stale: list[int] = []
                for index in frontiers[region]:
                    if regions[index] != -1:
                        stale.append(index)
                    elif not known[index] or hole_counts[region] < k:
                        valid.append(index)
                for index in stale:
                    frontiers[region].discard(index)
                if valid:
                    choices.append((region, valid))
                    deficit = k - hole_counts[region]
                    weights.append(((deficit + 1) ** 3) / math.sqrt(sizes[region]))

            if not choices:
                failed = True
                break

            pick = rng.random() * sum(weights)
            selected = len(choices) - 1
            for position, weight in enumerate(weights):
                pick -= weight
                if pick <= 0:
                    selected = position
                    break
            region, valid = choices[selected]
            valid_holes = [index for index in valid if known[index]]
            index = rng.choice(valid_holes or valid)
            frontiers[region].discard(index)
            if regions[index] != -1:
                continue
            regions[index] = region
            sizes[region] += 1
            hole_counts[region] += known[index]
            assigned += 1
            add_frontier(region, index)

        if failed or any(count != k for count in hole_counts):
            continue
        if all(size == n for size in sizes):
            continue
        return regions, sizes

    raise RuntimeError("could not grow connected regions around the solution")


def random_connected_regions(
    rng: random.Random,
    n: int,
    minimum_size: int,
    max_attempts: int = 200,
) -> tuple[list[int], list[int]]:
    total = n * n
    for _ in range(max_attempts):
        regions = [-1] * total
        sizes = [0] * n
        frontiers = [set() for _ in range(n)]
        seeds = rng.sample(range(total), n)

        def add_frontier(region: int, index: int) -> None:
            for other in neighbors(index, n):
                if regions[other] == -1:
                    frontiers[region].add(other)

        for region, seed in enumerate(seeds):
            regions[seed] = region
            sizes[region] = 1
        for region, seed in enumerate(seeds):
            add_frontier(region, seed)

        assigned = n
        while assigned < total:
            choices: list[int] = []
            weights: list[float] = []
            for region in range(n):
                frontiers[region] = {
                    index for index in frontiers[region] if regions[index] == -1
                }
                if frontiers[region]:
                    choices.append(region)
                    weights.append(1.0 / (sizes[region] ** 1.5))
            if not choices:
                break

            pick = rng.random() * sum(weights)
            selected = len(choices) - 1
            for position, weight in enumerate(weights):
                pick -= weight
                if pick <= 0:
                    selected = position
                    break
            region = choices[selected]
            index = rng.choice(tuple(frontiers[region]))
            frontiers[region].discard(index)
            if regions[index] != -1:
                continue
            regions[index] = region
            sizes[region] += 1
            assigned += 1
            add_frontier(region, index)

        if assigned != total or min(sizes) < minimum_size:
            continue
        if all(size == n for size in sizes):
            continue
        return regions, sizes
    raise RuntimeError("could not generate random connected regions")


def path_regions_for_solution(
    rng: random.Random,
    known: list[int],
    n: int,
    k: int,
) -> tuple[list[int], list[int]]:
    transpose = bool(rng.getrandbits(1))
    flip_outer = bool(rng.getrandbits(1))
    flip_inner = bool(rng.getrandbits(1))
    outer_values = list(range(n))
    if flip_outer:
        outer_values.reverse()
    path: list[int] = []
    for position, outer in enumerate(outer_values):
        inner_values = list(range(n))
        if (position & 1) ^ flip_inner:
            inner_values.reverse()
        for inner in inner_values:
            row, col = (inner, outer) if transpose else (outer, inner)
            path.append(row * n + col)
    if rng.getrandbits(1):
        path.reverse()

    hole_positions = [position for position, index in enumerate(path) if known[index]]
    if len(hole_positions) != n * k:
        raise RuntimeError("known solution has the wrong number of holes")

    cuts: list[int] = []
    for region in range(n - 1):
        last_hole = hole_positions[(region + 1) * k - 1]
        next_hole = hole_positions[(region + 1) * k]
        cuts.append(rng.randint(last_hole, next_hole - 1))

    regions = [-1] * (n * n)
    sizes = [0] * n
    region = 0
    for position, index in enumerate(path):
        regions[index] = region
        sizes[region] += 1
        if region < n - 1 and position == cuts[region]:
            region += 1
    return regions, sizes


def random_transfer(
    rng: random.Random,
    regions: list[int],
    sizes: list[int],
    known: list[int],
    n: int,
    minimum_size: int,
    maximum_size: int,
) -> bool:
    indices = list(range(n * n))
    rng.shuffle(indices)
    for index in indices:
        if known[index]:
            continue
        receivers = list({regions[other] for other in neighbors(index, n) if regions[other] != regions[index]})
        rng.shuffle(receivers)
        for receiver in receivers:
            if try_transfer(
                regions, sizes, known, index, receiver, n, minimum_size, maximum_size
            ):
                return True
    return False


def generate(n: int, k: int, seed: int, max_steps: int, timeout_ms: int) -> dict:
    rng = random.Random(seed)
    stripe_regions = [row for row in range(n) for _ in range(n)]
    known = affine_solution(n, k) or solve_one(n, k, stripe_regions, timeout_ms)
    if known is None:
        raise RuntimeError("could not construct an initial solution")
    started = time.monotonic()
    for step in range(max_steps + 1):
        regions, sizes = path_regions_for_solution(rng, known, n, k)
        status, _ = find_alternative(n, k, regions, known, timeout_ms)
        elapsed = time.monotonic() - started
        print(
            f"candidate={step} status={status} elapsed={elapsed:.1f}s sizes={sizes}",
            file=sys.stderr,
            flush=True,
        )
        if status == "unique":
            return {
                "n": n,
                "k": k,
                "regions": [regions[row * n:(row + 1) * n] for row in range(n)],
                "solution": [known[row * n:(row + 1) * n] for row in range(n)],
                "seed": seed,
                "proof": "z3-unsat-after-excluding-known-solution",
            }
        if status == "timeout":
            continue
    raise RuntimeError(f"no unique puzzle after {max_steps + 1} candidates")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("n", type=int)
    parser.add_argument("k", type=int)
    parser.add_argument("--seed", type=int, default=1)
    parser.add_argument("--max-steps", type=int, default=1000)
    parser.add_argument("--timeout-ms", type=int, default=30000)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    puzzle = generate(args.n, args.k, args.seed, args.max_steps, args.timeout_ms)
    text = json.dumps(puzzle, ensure_ascii=False, separators=(",", ":"))
    if args.output:
        args.output.write_text(text + "\n", encoding="utf-8")
    else:
        print(text)


if __name__ == "__main__":
    main()
