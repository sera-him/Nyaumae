from __future__ import annotations

import argparse
import json
import math
import os
import random
import sys
import time
from collections import defaultdict, deque
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Sequence

from ortools import __version__ as ortools_version
from ortools.sat.python import cp_model


DIFFICULTIES = (
    ("very-easy", "非常简单", 4, 1),
    ("easy", "简单", 6, 1),
    ("medium", "中等", 8, 1),
    ("normal", "普通", 10, 1),
    ("hard", "困难", 10, 2),
    ("very-hard", "极难", 12, 2),
    ("nightmare", "噩梦", 14, 2),
    ("hell", "地狱", 14, 3),
    ("purgatory", "炼狱", 18, 3),
    ("dream", "梦魇", 20, 4),
    ("dream-ex", "梦魇EX", 24, 5),
    ("ragnarok", "诸神黄昏", 32, 6),
)


def cell(n: int, row: int, col: int) -> int:
    return row * n + col


@dataclass(frozen=True)
class BoardTopology:
    n: int
    n4: tuple[tuple[int, ...], ...]
    king_edges: tuple[tuple[int, int], ...]

    @classmethod
    def build(cls, n: int) -> "BoardTopology":
        n4: list[list[int]] = [[] for _ in range(n * n)]
        king_edges: list[tuple[int, int]] = []

        for row in range(n):
            for col in range(n):
                value = cell(n, row, col)
                for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    rr, cc = row + dr, col + dc
                    if 0 <= rr < n and 0 <= cc < n:
                        n4[value].append(cell(n, rr, cc))

                # One half of the undirected king-neighbor edges.
                for dr, dc in ((0, 1), (1, -1), (1, 0), (1, 1)):
                    rr, cc = row + dr, col + dc
                    if 0 <= rr < n and 0 <= cc < n:
                        king_edges.append((value, cell(n, rr, cc)))

        return cls(
            n=n,
            n4=tuple(tuple(neighbors) for neighbors in n4),
            king_edges=tuple(king_edges),
        )


def sample_region_sizes(n: int, k: int, rng: random.Random) -> list[int]:
    """Uniform ordered composition with every region at least 2*k-1 cells."""
    minimum = max(1, 2 * k - 1)
    volume = n * n
    if n * minimum > volume:
        raise ValueError(f"n={n}, k={k} cannot support minimum region size {minimum}")

    # x_i = size_i - (minimum - 1) >= 1.
    remaining = volume - n * (minimum - 1)
    cuts = sorted(rng.sample(range(1, remaining), n - 1))
    sizes: list[int] = []
    previous = 0
    for cut in cuts + [remaining]:
        sizes.append(cut - previous + minimum - 1)
        previous = cut
    rng.shuffle(sizes)
    assert sum(sizes) == volume and min(sizes) >= minimum
    return sizes


def balanced_region_sizes(n: int, k: int, rng: random.Random) -> list[int]:
    """Keep region areas close to n while retaining a randomized distribution."""
    variation = max(1, n // 6)
    minimum = max(2 * k - 1, n - variation)
    maximum = n + variation
    sizes = [n] * n

    # Unit transfers preserve the total area. The bounds avoid tiny regions
    # that make an initial k-hole solution unnecessarily unlikely.
    for _ in range(n * 20):
        donor = rng.randrange(n)
        receiver = rng.randrange(n - 1)
        if receiver >= donor:
            receiver += 1
        if sizes[donor] <= minimum or sizes[receiver] >= maximum:
            continue
        sizes[donor] -= 1
        sizes[receiver] += 1

    rng.shuffle(sizes)
    assert sum(sizes) == n * n and min(sizes) >= minimum and max(sizes) <= maximum
    return sizes


def hilbert_rot(size: int, x: int, y: int, rx: int, ry: int) -> tuple[int, int]:
    if ry == 0:
        if rx == 1:
            x = size - 1 - x
            y = size - 1 - y
        x, y = y, x
    return x, y


def hilbert_d2xy(n: int, distance: int) -> tuple[int, int]:
    x = y = 0
    scale = 1
    value = distance
    while scale < n:
        rx = 1 & (value // 2)
        ry = 1 & (value ^ rx)
        x, y = hilbert_rot(scale, x, y, rx, ry)
        x += scale * rx
        y += scale * ry
        value //= 4
        scale *= 2
    return x, y


def transform_xy(n: int, x: int, y: int, symmetry: int) -> tuple[int, int]:
    if symmetry == 0:
        return x, y
    if symmetry == 1:
        return n - 1 - y, x
    if symmetry == 2:
        return n - 1 - x, n - 1 - y
    if symmetry == 3:
        return y, n - 1 - x
    if symmetry == 4:
        return n - 1 - x, y
    if symmetry == 5:
        return x, n - 1 - y
    if symmetry == 6:
        return y, x
    return n - 1 - y, n - 1 - x


def make_connected_path(n: int, rng: random.Random) -> list[int]:
    """Hilbert for power-of-two boards; a Hamiltonian snake otherwise."""
    symmetry = rng.randrange(8)
    if n & (n - 1) == 0:
        points = [hilbert_d2xy(n, distance) for distance in range(n * n)]
    else:
        points = []
        for y in range(n):
            columns: Iterable[int] = range(n) if y % 2 == 0 else range(n - 1, -1, -1)
            points.extend((x, y) for x in columns)

    path = [
        cell(n, yy, xx)
        for x, y in points
        for xx, yy in (transform_xy(n, x, y, symmetry),)
    ]
    if rng.randrange(2):
        path.reverse()
    return path


def initial_regions(n: int, sizes: Sequence[int], rng: random.Random) -> list[int]:
    path = make_connected_path(n, rng)
    labels = [-1] * (n * n)
    offset = 0
    for region, size in enumerate(sizes):
        for value in path[offset : offset + size]:
            labels[value] = region
        offset += size
    assert offset == n * n and all(label >= 0 for label in labels)
    return labels


def regions_from_target_path(
    n: int,
    k: int,
    target: Sequence[int],
    rng: random.Random,
) -> tuple[list[int], list[int]]:
    """Cut a connected path after each group of k target holes."""
    path = make_connected_path(n, rng)
    hole_positions = [index for index, value in enumerate(path) if target[value]]
    if len(hole_positions) != n * k:
        raise ValueError("target has the wrong number of holes")

    ends: list[int] = []
    previous = 0
    for region in range(n - 1):
        lower = hole_positions[(region + 1) * k - 1] + 1
        upper = hole_positions[(region + 1) * k]
        ideal = (region + 1) * n
        jitter = rng.randint(-max(1, n // 8), max(1, n // 8))
        end = min(upper, max(lower, ideal + jitter))
        if end <= previous:
            raise RuntimeError("invalid target-path boundary")
        ends.append(end)
        previous = end
    ends.append(n * n)

    labels = [-1] * (n * n)
    sizes: list[int] = []
    start = 0
    for region, end in enumerate(ends):
        for value in path[start:end]:
            labels[value] = region
        sizes.append(end - start)
        start = end

    assert all(label >= 0 for label in labels)
    counts = [0] * n
    for value, is_hole in enumerate(target):
        if is_hole:
            counts[labels[value]] += 1
    assert all(count == k for count in counts)
    return labels, sizes


class RegionState:
    def __init__(self, topology: BoardTopology, labels: Sequence[int]):
        self.topology = topology
        self.n = topology.n
        self.labels = list(labels)
        self.members: list[list[int]] = [[] for _ in range(self.n)]
        self.position = [0] * (self.n * self.n)

        for value, region in enumerate(self.labels):
            self.position[value] = len(self.members[region])
            self.members[region].append(value)

    def has_neighbor_label(self, value: int, label: int, exclude: int = -1) -> bool:
        return any(
            neighbor != exclude and self.labels[neighbor] == label
            for neighbor in self.topology.n4[value]
        )

    def removal_ok(self, region: int, removed: int) -> bool:
        members = self.members[region]
        if len(members) <= 1:
            return False

        same = [
            neighbor
            for neighbor in self.topology.n4[removed]
            if self.labels[neighbor] == region
        ]
        if len(same) <= 1:
            return True

        queue = deque([same[0]])
        seen = {same[0]}
        while queue:
            value = queue.popleft()
            for neighbor in self.topology.n4[value]:
                if (
                    neighbor != removed
                    and self.labels[neighbor] == region
                    and neighbor not in seen
                ):
                    seen.add(neighbor)
                    queue.append(neighbor)
        return len(seen) == len(members) - 1

    def swap(self, left: int, right: int) -> None:
        a = self.labels[left]
        b = self.labels[right]
        if a == b:
            raise ValueError("cannot swap two cells in the same region")

        left_position = self.position[left]
        right_position = self.position[right]
        self.members[a][left_position] = right
        self.position[right] = left_position
        self.members[b][right_position] = left
        self.position[left] = right_position
        self.labels[left] = b
        self.labels[right] = a

    def move(self, value: int, destination: int) -> None:
        source = self.labels[value]
        if source == destination:
            raise ValueError("cell already belongs to the destination region")

        position = self.position[value]
        tail = self.members[source].pop()
        if tail != value:
            self.members[source][position] = tail
            self.position[tail] = position

        self.position[value] = len(self.members[destination])
        self.members[destination].append(value)
        self.labels[value] = destination

    def validate_connected(self) -> bool:
        for region, members in enumerate(self.members):
            if not members:
                return False
            queue = deque([members[0]])
            seen = {members[0]}
            while queue:
                value = queue.popleft()
                for neighbor in self.topology.n4[value]:
                    if self.labels[neighbor] == region and neighbor not in seen:
                        seen.add(neighbor)
                        queue.append(neighbor)
            if len(seen) != len(members):
                return False
        return True


def random_preserving_mix(
    state: RegionState,
    rng: random.Random,
    attempts: int,
    preserved_solutions: Sequence[Sequence[int]],
    invalidity_guard: "InvalidityGuard | None" = None,
) -> int:
    accepted = 0
    n = state.n
    for _ in range(attempts):
        a = rng.randrange(n)
        b = rng.randrange(n - 1)
        if b >= a:
            b += 1
        left = rng.choice(state.members[a])
        right = rng.choice(state.members[b])

        if any(solution[left] != solution[right] for solution in preserved_solutions):
            continue
        if not state.has_neighbor_label(left, b, right):
            continue
        if not state.has_neighbor_label(right, a, left):
            continue
        if not state.removal_ok(a, left) or not state.removal_ok(b, right):
            continue

        if invalidity_guard is not None and not invalidity_guard.allows_swap(state, left, right):
            continue

        if invalidity_guard is not None:
            invalidity_guard.apply_swap(state, left, right)
        state.swap(left, right)
        accepted += 1
    return accepted


def random_preserving_empty_moves(
    state: RegionState,
    rng: random.Random,
    attempts: int,
    preserved_solutions: Sequence[Sequence[int]],
    minimum_size: int,
    maximum_size: int,
    invalidity_guard: "InvalidityGuard | None" = None,
) -> int:
    """Change region areas without changing any preserved solution's counts."""
    accepted = 0
    for _ in range(attempts):
        value = rng.randrange(state.n * state.n)
        source = state.labels[value]
        if len(state.members[source]) <= minimum_size:
            continue
        if any(solution[value] for solution in preserved_solutions):
            continue
        destinations = [
            state.labels[neighbor]
            for neighbor in state.topology.n4[value]
            if state.labels[neighbor] != source
            and len(state.members[state.labels[neighbor]]) < maximum_size
        ]
        if not destinations or not state.removal_ok(source, value):
            continue
        destination = rng.choice(destinations)
        if invalidity_guard is not None and not invalidity_guard.allows_move(
            state, value, destination
        ):
            continue

        if invalidity_guard is not None:
            invalidity_guard.apply_move(state, value, destination)
        state.move(value, destination)
        accepted += 1
    return accepted


def build_cp_model(
    n: int,
    k: int,
    topology: BoardTopology,
    labels: Sequence[int] | None,
    blocked_solution: Sequence[int] | None = None,
    clues: dict[int, int] | None = None,
) -> tuple[cp_model.CpModel, list[cp_model.IntVar]]:
    model = cp_model.CpModel()
    variables = [model.new_bool_var(f"x_{value}") for value in range(n * n)]

    for row in range(n):
        model.add(sum(variables[cell(n, row, col)] for col in range(n)) == k)
    for col in range(n):
        model.add(sum(variables[cell(n, row, col)] for row in range(n)) == k)

    if labels is not None:
        regions: list[list[int]] = [[] for _ in range(n)]
        for value, region in enumerate(labels):
            regions[region].append(value)
        for members in regions:
            model.add(sum(variables[value] for value in members) == k)

    for left, right in topology.king_edges:
        model.add(variables[left] + variables[right] <= 1)

    if blocked_solution is not None:
        # Every valid board contains exactly n*k holes. If it contains every
        # hole of S, it is S; requiring one missing S-hole blocks exactly S.
        model.add(
            sum(
                variables[value]
                for value, is_hole in enumerate(blocked_solution)
                if is_hole
            )
            <= n * k - 1
        )

    if clues:
        for value, expected in clues.items():
            model.add(variables[value] == expected)

    return model, variables


@dataclass(frozen=True)
class SolveResult:
    status: int
    solution: list[int] | None
    elapsed_seconds: float


def solve_one(
    n: int,
    k: int,
    topology: BoardTopology,
    labels: Sequence[int] | None,
    blocked_solution: Sequence[int] | None,
    timeout: float,
    workers: int,
    seed: int,
    clues: dict[int, int] | None = None,
) -> SolveResult:
    model, variables = build_cp_model(n, k, topology, labels, blocked_solution, clues)
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = timeout
    solver.parameters.num_search_workers = workers
    solver.parameters.random_seed = seed & 0x7FFFFFFF
    started = time.perf_counter()
    status = solver.solve(model)
    elapsed = time.perf_counter() - started
    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        solution = [int(solver.value(variable)) for variable in variables]
    else:
        solution = None
    return SolveResult(status=status, solution=solution, elapsed_seconds=elapsed)


def solution_is_valid(
    n: int,
    k: int,
    topology: BoardTopology,
    labels: Sequence[int],
    solution: Sequence[int],
) -> bool:
    if len(solution) != n * n:
        return False
    if any(sum(solution[cell(n, row, col)] for col in range(n)) != k for row in range(n)):
        return False
    if any(sum(solution[cell(n, row, col)] for row in range(n)) != k for col in range(n)):
        return False

    counts = [0] * n
    for value, is_hole in enumerate(solution):
        if is_hole:
            counts[labels[value]] += 1
    if any(count != k for count in counts):
        return False
    return all(not (solution[left] and solution[right]) for left, right in topology.king_edges)


@dataclass
class GuardedSolution:
    solution: Sequence[int]
    region_counts: list[int]
    bad_regions: int


class InvalidityGuard:
    """Prevents a later region swap from resurrecting an eliminated solution."""

    def __init__(self, k: int, limit: int):
        self.k = k
        self.limit = max(0, limit)
        self.guarded: list[GuardedSolution] = []

    def add(self, state: RegionState, solution: Sequence[int]) -> None:
        if len(self.guarded) >= self.limit:
            return
        counts = [0] * state.n
        for value, is_hole in enumerate(solution):
            if is_hole:
                counts[state.labels[value]] += 1
        bad = sum(count != self.k for count in counts)
        if bad <= 0:
            raise ValueError("only an already-invalid solution can be guarded")
        self.guarded.append(GuardedSolution(solution, counts, bad))

    def allows_swap(self, state: RegionState, left: int, right: int) -> bool:
        a = state.labels[left]
        b = state.labels[right]
        for guarded in self.guarded:
            counts = guarded.region_counts
            next_a = counts[a] - guarded.solution[left] + guarded.solution[right]
            next_b = counts[b] - guarded.solution[right] + guarded.solution[left]
            next_bad = (
                guarded.bad_regions
                - int(counts[a] != self.k)
                - int(counts[b] != self.k)
                + int(next_a != self.k)
                + int(next_b != self.k)
            )
            if next_bad <= 0:
                return False
        return True

    def apply_swap(self, state: RegionState, left: int, right: int) -> None:
        a = state.labels[left]
        b = state.labels[right]
        for guarded in self.guarded:
            counts = guarded.region_counts
            next_a = counts[a] - guarded.solution[left] + guarded.solution[right]
            next_b = counts[b] - guarded.solution[right] + guarded.solution[left]
            guarded.bad_regions = (
                guarded.bad_regions
                - int(counts[a] != self.k)
                - int(counts[b] != self.k)
                + int(next_a != self.k)
                + int(next_b != self.k)
            )
            counts[a] = next_a
            counts[b] = next_b
            assert guarded.bad_regions > 0

    def allows_move(self, state: RegionState, value: int, destination: int) -> bool:
        source = state.labels[value]
        for guarded in self.guarded:
            counts = guarded.region_counts
            next_source = counts[source] - guarded.solution[value]
            next_destination = counts[destination] + guarded.solution[value]
            next_bad = (
                guarded.bad_regions
                - int(counts[source] != self.k)
                - int(counts[destination] != self.k)
                + int(next_source != self.k)
                + int(next_destination != self.k)
            )
            if next_bad <= 0:
                return False
        return True

    def apply_move(self, state: RegionState, value: int, destination: int) -> None:
        source = state.labels[value]
        for guarded in self.guarded:
            counts = guarded.region_counts
            next_source = counts[source] - guarded.solution[value]
            next_destination = counts[destination] + guarded.solution[value]
            guarded.bad_regions = (
                guarded.bad_regions
                - int(counts[source] != self.k)
                - int(counts[destination] != self.k)
                + int(next_source != self.k)
                + int(next_destination != self.k)
            )
            counts[source] = next_source
            counts[destination] = next_destination
            assert guarded.bad_regions > 0


def find_killing_swap(
    state: RegionState,
    target: Sequence[int],
    counterexample: Sequence[int],
    rng: random.Random,
    invalidity_guard: InvalidityGuard | None = None,
) -> tuple[int, int] | None:
    removable = [False] * (state.n * state.n)
    for region, members in enumerate(state.members):
        for value in members:
            removable[value] = state.removal_ok(region, value)

    boundary: dict[tuple[int, int], set[int]] = defaultdict(set)
    for left in range(state.n * state.n):
        a = state.labels[left]
        for neighbor in state.topology.n4[left]:
            b = state.labels[neighbor]
            if a != b:
                boundary[a, b].add(left)

    chosen: tuple[int, int] | None = None
    choices = 0
    for a in range(state.n):
        for b in range(a + 1, state.n):
            left_candidates = boundary.get((a, b))
            right_candidates = boundary.get((b, a))
            if not left_candidates or not right_candidates:
                continue

            for left in left_candidates:
                if not removable[left]:
                    continue
                for right in right_candidates:
                    if not removable[right]:
                        continue
                    if target[left] != target[right]:
                        continue
                    if counterexample[left] == counterexample[right]:
                        continue
                    if not state.has_neighbor_label(left, b, right):
                        continue
                    if not state.has_neighbor_label(right, a, left):
                        continue
                    if invalidity_guard is not None and not invalidity_guard.allows_swap(
                        state, left, right
                    ):
                        continue

                    choices += 1
                    if rng.randrange(choices) == 0:
                        chosen = (left, right)
    return chosen


def find_killing_move(
    state: RegionState,
    target: Sequence[int],
    counterexample: Sequence[int],
    rng: random.Random,
    minimum_size: int,
    maximum_size: int,
    invalidity_guard: InvalidityGuard | None = None,
) -> tuple[int, int] | None:
    """Move an S-empty/T-hole boundary cell; this preserves S and kills T."""
    chosen: tuple[int, int] | None = None
    choices = 0
    for value in range(state.n * state.n):
        source = state.labels[value]
        if target[value] or not counterexample[value]:
            continue
        if len(state.members[source]) <= minimum_size:
            continue
        if not state.removal_ok(source, value):
            continue

        destinations = {
            state.labels[neighbor]
            for neighbor in state.topology.n4[value]
            if state.labels[neighbor] != source
            and len(state.members[state.labels[neighbor]]) < maximum_size
        }
        for destination in destinations:
            if invalidity_guard is not None and not invalidity_guard.allows_move(
                state, value, destination
            ):
                continue
            choices += 1
            if rng.randrange(choices) == 0:
                chosen = (value, destination)
    return chosen


@dataclass(frozen=True)
class ClueResult:
    clues: dict[int, int]
    proof_seconds: float
    additions: int


def make_unique_with_hole_clues(
    n: int,
    k: int,
    topology: BoardTopology,
    labels: Sequence[int],
    target: Sequence[int],
    rng: random.Random,
    timeout: float,
    workers: int,
) -> ClueResult | None:
    """Guaranteed-progress fallback: every alternative omits an S-hole."""
    clues: dict[int, int] = {}
    additions = 0
    proof_seconds = 0.0

    while True:
        result = solve_one(
            n,
            k,
            topology,
            labels,
            target,
            timeout,
            workers,
            rng.randrange(1 << 31),
            clues,
        )
        proof_seconds = result.elapsed_seconds
        if result.status == cp_model.INFEASIBLE:
            break
        if result.solution is None:
            return None

        candidates = [
            value
            for value in range(n * n)
            if target[value] and not result.solution[value] and value not in clues
        ]
        if not candidates:
            raise RuntimeError("a distinct equal-cardinality solution omitted no target hole")
        clues[rng.choice(candidates)] = 1
        additions += 1

    # Greedy irredundancy pass. UNKNOWN keeps the clue; only an exact
    # INFEASIBLE result is allowed to remove it.
    clue_order = list(clues)
    rng.shuffle(clue_order)
    for value in clue_order:
        trial = dict(clues)
        del trial[value]
        result = solve_one(
            n,
            k,
            topology,
            labels,
            target,
            timeout,
            workers,
            rng.randrange(1 << 31),
            trial,
        )
        if result.status == cp_model.INFEASIBLE:
            clues = trial
            proof_seconds = result.elapsed_seconds

    final = solve_one(
        n,
        k,
        topology,
        labels,
        target,
        timeout,
        workers,
        rng.randrange(1 << 31),
        clues,
    )
    if final.status != cp_model.INFEASIBLE:
        return None
    return ClueResult(clues=clues, proof_seconds=final.elapsed_seconds, additions=additions)


def encode_rows(values: Sequence[int], n: int) -> list[str]:
    alphabet = "0123456789abcdefghijklmnopqrstuvwxyz"
    if max(values, default=0) >= len(alphabet):
        raise ValueError("row encoding supports values below 36")
    return [
        "".join(alphabet[values[cell(n, row, col)]] for col in range(n))
        for row in range(n)
    ]


@dataclass(frozen=True)
class GeneratorSettings:
    workers: int
    find_time: float
    unique_time: float
    restarts: int
    kill_limit: int
    mix_factor: int
    unlock_factor: int
    size_mode: str
    guard_limit: int


def generate_unique_puzzle(
    difficulty_id: str,
    name: str,
    n: int,
    k: int,
    seed: int,
    settings: GeneratorSettings,
) -> dict:
    topology = BoardTopology.build(n)
    rng = random.Random(seed)

    for restart in range(1, settings.restarts + 1):
        if settings.size_mode == "target-path":
            first = solve_one(
                n,
                k,
                topology,
                None,
                None,
                settings.find_time,
                settings.workers,
                rng.randrange(1 << 31),
            )
            if first.solution is None:
                print(
                    f"[{difficulty_id}] base target inconclusive: "
                    f"{cp_model.CpSolver().status_name(first.status)}",
                    flush=True,
                )
                continue
            target = first.solution
            labels, sizes = regions_from_target_path(n, k, target, rng)
            state = RegionState(topology, labels)
            print(
                f"[{difficulty_id}] restart={restart} target-path sizes="
                f"{min(sizes)}..{max(sizes)}",
                flush=True,
            )
        else:
            sizes = (
                balanced_region_sizes(n, k, rng)
                if settings.size_mode == "balanced"
                else sample_region_sizes(n, k, rng)
            )
            state = RegionState(topology, initial_regions(n, sizes, rng))
            print(
                f"[{difficulty_id}] restart={restart} sizes={min(sizes)}..{max(sizes)} "
                "finding target",
                flush=True,
            )
            first = solve_one(
                n,
                k,
                topology,
                state.labels,
                None,
                settings.find_time,
                settings.workers,
                rng.randrange(1 << 31),
            )
            if first.solution is None:
                print(
                    f"  target inconclusive: {cp_model.CpSolver().status_name(first.status)}",
                    flush=True,
                )
                continue
            target = first.solution
        assert solution_is_valid(n, k, topology, state.labels, target)

        minimum_size = max(2 * k - 1, n // 2)
        maximum_size = max(2 * n, max(sizes) + 2)

        accepted = random_preserving_mix(
            state,
            rng,
            max(n * n * settings.mix_factor, 1_000),
            [target],
        )
        moved = random_preserving_empty_moves(
            state,
            rng,
            max(n * n * settings.mix_factor, 1_000),
            [target],
            minimum_size,
            maximum_size,
        )
        print(
            f"  target found; preserving swaps={accepted}, empty moves={moved}",
            flush=True,
        )
        assert state.validate_connected()
        assert solution_is_valid(n, k, topology, state.labels, target)

        proof_seconds = 0.0
        unique = False
        iterations_used = 0
        clues: dict[int, int] = {}
        clue_additions = 0
        invalidity_guard = InvalidityGuard(k, settings.guard_limit)
        for iteration in range(1, settings.kill_limit + 1):
            iterations_used = iteration
            second = solve_one(
                n,
                k,
                topology,
                state.labels,
                target,
                settings.unique_time,
                settings.workers,
                rng.randrange(1 << 31),
            )
            proof_seconds = second.elapsed_seconds
            if second.status == cp_model.INFEASIBLE:
                unique = True
                iterations_used = iteration
                print(
                    f"  iteration={iteration}: blocked model INFEASIBLE "
                    f"({proof_seconds:.3f}s) -- UNIQUE",
                    flush=True,
                )
                break
            if second.solution is None:
                print(
                    f"  iteration={iteration}: proof inconclusive "
                    f"({cp_model.CpSolver().status_name(second.status)})",
                    flush=True,
                )
                break

            killer = find_killing_swap(
                state,
                target,
                second.solution,
                rng,
                invalidity_guard,
            )
            killing_move = None if killer is not None else find_killing_move(
                state,
                target,
                second.solution,
                rng,
                minimum_size,
                maximum_size,
                invalidity_guard,
            )
            if killer is None and killing_move is None:
                unlocked = random_preserving_mix(
                    state,
                    rng,
                    max(n * n * settings.unlock_factor, 200),
                    [target, second.solution],
                    invalidity_guard,
                )
                moved = random_preserving_empty_moves(
                    state,
                    rng,
                    max(n * n * settings.unlock_factor, 200),
                    [target, second.solution],
                    minimum_size,
                    maximum_size,
                    invalidity_guard,
                )
                print(
                    f"    no direct killer; neutral swaps={unlocked}, moves={moved}",
                    flush=True,
                )
                killer = find_killing_swap(
                    state,
                    target,
                    second.solution,
                    rng,
                    invalidity_guard,
                )
                killing_move = None if killer is not None else find_killing_move(
                    state,
                    target,
                    second.solution,
                    rng,
                    minimum_size,
                    maximum_size,
                    invalidity_guard,
                )
            if killer is None and killing_move is None:
                print("    no killing region edit; switching to clue fallback", flush=True)
                break

            if killer is not None:
                left, right = killer
                invalidity_guard.apply_swap(state, left, right)
                state.swap(left, right)
            else:
                assert killing_move is not None
                value, destination = killing_move
                invalidity_guard.apply_move(state, value, destination)
                state.move(value, destination)
            assert solution_is_valid(n, k, topology, state.labels, target)
            assert not solution_is_valid(n, k, topology, state.labels, second.solution)
            assert state.validate_connected()
            invalidity_guard.add(state, second.solution)

            if iteration % 25 == 0:
                print(
                    f"  iteration={iteration}: guarded alternatives="
                    f"{len(invalidity_guard.guarded)}/{settings.guard_limit}",
                    flush=True,
                )

        if not unique:
            print("  region editing did not converge; adding exact hole clues", flush=True)
            clue_result = make_unique_with_hole_clues(
                n,
                k,
                topology,
                state.labels,
                target,
                rng,
                settings.unique_time,
                settings.workers,
            )
            if clue_result is None:
                print("  clue fallback was inconclusive; restarting", flush=True)
                continue
            clues = clue_result.clues
            clue_additions = clue_result.additions
            proof_seconds = clue_result.proof_seconds
            unique = True
            print(
                f"  clue fallback UNIQUE: kept={len(clues)}, "
                f"added={clue_additions}, proof={proof_seconds:.3f}s",
                flush=True,
            )

        # Rebuild the blocked model from scratch with a fixed, different seed.
        # Only a second INFEASIBLE result is serialized as a certificate.
        final_proof = solve_one(
            n,
            k,
            topology,
            state.labels,
            target,
            settings.unique_time,
            settings.workers,
            (seed ^ 0x5F3759DF) & 0x7FFFFFFF,
            clues,
        )
        if final_proof.status != cp_model.INFEASIBLE:
            print("  final independent rebuild was inconclusive; restarting", flush=True)
            continue

        assert state.validate_connected()
        assert solution_is_valid(n, k, topology, state.labels, target)
        return {
            "id": f"{difficulty_id}-{seed:x}",
            "difficultyId": difficulty_id,
            "name": name,
            "n": n,
            "k": k,
            "seed": str(seed),
            "regions": encode_rows(state.labels, n),
            "solution": encode_rows(target, n),
            "clues": sorted(clues),
            "certificate": {
                "kind": (
                    "cp-sat-blocked-solution-plus-clues-infeasible"
                    if clues
                    else "cp-sat-blocked-solution-infeasible"
                ),
                "status": "INFEASIBLE",
                "ortoolsVersion": ortools_version,
                "restart": restart,
                "killIterations": iterations_used,
                "sizeMode": settings.size_mode,
                "guardLimit": settings.guard_limit,
                "clueCount": len(clues),
                "clueAdditionsBeforeMinimization": clue_additions,
                "proofSeconds": round(final_proof.elapsed_seconds, 6),
                "regionsConnected": True,
                "solutionValid": True,
            },
        }

    raise RuntimeError(f"failed to generate {difficulty_id} within {settings.restarts} restarts")


def decode_rows(rows: Sequence[str], n: int) -> list[int]:
    if len(rows) != n or any(len(row) != n for row in rows):
        raise ValueError("encoded grid has the wrong dimensions")
    return [int(char, 36) for row in rows for char in row]


def verify_bank(path: Path, timeout: float, workers: int) -> None:
    document = json.loads(path.read_text(encoding="utf-8"))
    puzzles = document.get("puzzles", [])
    if not puzzles:
        raise RuntimeError("puzzle bank is empty")

    for puzzle in puzzles:
        n = int(puzzle["n"])
        k = int(puzzle["k"])
        labels = decode_rows(puzzle["regions"], n)
        target = decode_rows(puzzle["solution"], n)
        clues = {int(value): 1 for value in puzzle.get("clues", [])}
        topology = BoardTopology.build(n)
        state = RegionState(topology, labels)
        if not state.validate_connected():
            raise RuntimeError(f"{puzzle['id']}: a region is disconnected")
        if not solution_is_valid(n, k, topology, labels, target):
            raise RuntimeError(f"{puzzle['id']}: stored solution is invalid")

        result = solve_one(
            n,
            k,
            topology,
            labels,
            target,
            timeout,
            workers,
            0x51A7,
            clues,
        )
        status_name = cp_model.CpSolver().status_name(result.status)
        print(f"[{puzzle['id']}] blocked model: {status_name} ({result.elapsed_seconds:.3f}s)")
        if result.status != cp_model.INFEASIBLE:
            raise RuntimeError(f"{puzzle['id']}: uniqueness was not proved")


def merge_banks(paths: Sequence[Path], output: Path) -> None:
    by_difficulty: dict[str, dict] = {}
    for path in paths:
        document = json.loads(path.read_text(encoding="utf-8"))
        for puzzle in document.get("puzzles", []):
            difficulty_id = puzzle["difficultyId"]
            if difficulty_id in by_difficulty:
                raise RuntimeError(f"duplicate puzzle for {difficulty_id}")
            puzzle.setdefault("clues", [])
            by_difficulty[difficulty_id] = puzzle

    expected = [difficulty[0] for difficulty in DIFFICULTIES]
    missing = [difficulty_id for difficulty_id in expected if difficulty_id not in by_difficulty]
    if missing:
        raise RuntimeError(f"missing puzzle(s): {', '.join(missing)}")

    document = {
        "schemaVersion": 1,
        "generator": "three_holes_unique_generator.py",
        "algorithm": "cp-sat-blocking-with-region-edits-and-irredundant-hole-clue-fallback",
        "ortoolsVersion": ortools_version,
        "puzzles": [by_difficulty[difficulty_id] for difficulty_id in expected],
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(document, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"merged {len(expected)} certified puzzles into {output}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate Three Holes boards whose uniqueness is proved by OR-Tools CP-SAT.",
    )
    parser.add_argument("--difficulty", action="append", help="difficulty id; repeatable (default: all)")
    parser.add_argument("--seed", type=int, default=0xC0D3_2026_0723)
    parser.add_argument("--output", type=Path, default=Path("src/game/threeHoles/puzzles.generated.json"))
    parser.add_argument("--verify", type=Path, help="verify an existing generated JSON bank instead")
    parser.add_argument(
        "--merge",
        type=Path,
        action="append",
        help="merge complete single-difficulty banks; repeat for every input",
    )
    parser.add_argument("--workers", type=int, default=max(1, os.cpu_count() or 1))
    parser.add_argument("--find-time", type=float, default=30.0)
    parser.add_argument("--unique-time", type=float, default=120.0)
    parser.add_argument("--restarts", type=int, default=100)
    parser.add_argument("--kill-limit", type=int, default=500)
    parser.add_argument("--mix-factor", type=int, default=100)
    parser.add_argument("--unlock-factor", type=int, default=20)
    parser.add_argument(
        "--size-mode",
        choices=("target-path", "balanced", "composition"),
        default="target-path",
        help="target-path is recommended for the multi-size web-game bank",
    )
    parser.add_argument(
        "--guard-limit",
        type=int,
        default=256,
        help="maximum prior counterexamples protected from resurrection",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.verify:
        verify_bank(args.verify, args.unique_time, args.workers)
        return
    if args.merge:
        merge_banks(args.merge, args.output)
        return

    selected_ids = set(args.difficulty or (difficulty[0] for difficulty in DIFFICULTIES))
    unknown = selected_ids.difference(difficulty[0] for difficulty in DIFFICULTIES)
    if unknown:
        raise ValueError(f"unknown difficulty ids: {', '.join(sorted(unknown))}")

    settings = GeneratorSettings(
        workers=args.workers,
        find_time=args.find_time,
        unique_time=args.unique_time,
        restarts=args.restarts,
        kill_limit=args.kill_limit,
        mix_factor=args.mix_factor,
        unlock_factor=args.unlock_factor,
        size_mode=args.size_mode,
        guard_limit=args.guard_limit,
    )
    puzzles = []
    for index, (difficulty_id, name, n, k) in enumerate(DIFFICULTIES):
        if difficulty_id not in selected_ids:
            continue
        puzzle_seed = args.seed + index * 0x9E3779B97F4A7C15
        puzzles.append(
            generate_unique_puzzle(difficulty_id, name, n, k, puzzle_seed, settings)
        )

    document = {
        "schemaVersion": 1,
        "generator": "three_holes_unique_generator.py",
        "algorithm": "cp-sat-blocking-plus-solution-preserving-region-swaps",
        "ortoolsVersion": ortools_version,
        "puzzles": puzzles,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(document, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"wrote {len(puzzles)} certified puzzle(s) to {args.output}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("interrupted", file=sys.stderr)
        raise SystemExit(130)
