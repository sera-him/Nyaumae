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


@dataclass(frozen=True)
class RegionShape:
    area: int
    height: int
    width: int
    aspect: float
    fill: float
    longest_vertical: int
    longest_horizontal: int
    perimeter: int


@dataclass(frozen=True)
class BoardShape:
    orientation_bias: float
    maximum_aspect: float
    minimum_fill: float
    maximum_run_share: float
    maximum_run: int
    vertical_boundaries: int
    horizontal_boundaries: int


def longest_consecutive(values: Iterable[int]) -> int:
    ordered = sorted(values)
    if not ordered:
        return 0
    best = current = 1
    for left, right in zip(ordered, ordered[1:]):
        current = current + 1 if right == left + 1 else 1
        best = max(best, current)
    return best


def region_shape(values: Sequence[int], n: int) -> RegionShape:
    members = set(values)
    rows = [value // n for value in members]
    cols = [value % n for value in members]
    height = max(rows) - min(rows) + 1
    width = max(cols) - min(cols) + 1
    longest_vertical = max(
        longest_consecutive(value // n for value in members if value % n == col)
        for col in set(cols)
    )
    longest_horizontal = max(
        longest_consecutive(value % n for value in members if value // n == row)
        for row in set(rows)
    )
    perimeter = 0
    for value in members:
        row, col = divmod(value, n)
        for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            rr, cc = row + dr, col + dc
            if rr < 0 or rr >= n or cc < 0 or cc >= n or cell(n, rr, cc) not in members:
                perimeter += 1
    return RegionShape(
        area=len(members),
        height=height,
        width=width,
        aspect=max(height, width) / min(height, width),
        fill=len(members) / (height * width),
        longest_vertical=longest_vertical,
        longest_horizontal=longest_horizontal,
        perimeter=perimeter,
    )


def region_shape_is_natural(
    shape: RegionShape,
    n: int,
    k: int,
    minimum_size: int,
    maximum_size: int,
) -> bool:
    if not minimum_size <= shape.area <= maximum_size:
        return False
    if shape.area >= 7 and min(shape.height, shape.width) < 2:
        return False
    if shape.aspect > (2.8 if n <= 6 else 2.45):
        return False
    if shape.fill < (0.28 if shape.area <= 8 else 0.34):
        return False
    longest = max(shape.longest_vertical, shape.longest_horizontal)
    if longest > max(4, math.ceil(2.25 * math.sqrt(shape.area))):
        return False
    if shape.area >= 8 and longest / shape.area > 0.56:
        return False
    if shape.perimeter > math.ceil(7.2 * math.sqrt(shape.area)):
        return False
    # A k-hole region needs room for the holes without turning into a corridor.
    if shape.area < max(2 * k + 1, 3):
        return False
    return True


def region_shape_penalty(shape: RegionShape) -> float:
    longest = max(shape.longest_vertical, shape.longest_horizontal)
    return (
        2.2 * (shape.aspect - 1.0) ** 2
        + 3.0 * (1.0 - shape.fill)
        + 0.65 * longest / math.sqrt(shape.area)
        + 0.18 * shape.perimeter / math.sqrt(shape.area)
    )


def board_shape(labels: Sequence[int], n: int) -> BoardShape:
    members: list[list[int]] = [[] for _ in range(n)]
    for value, region in enumerate(labels):
        members[region].append(value)
    shapes = [region_shape(values, n) for values in members]
    vertical_boundaries = sum(
        labels[cell(n, row, col)] != labels[cell(n, row, col + 1)]
        for row in range(n)
        for col in range(n - 1)
    )
    horizontal_boundaries = sum(
        labels[cell(n, row, col)] != labels[cell(n, row + 1, col)]
        for row in range(n - 1)
        for col in range(n)
    )
    boundary_total = vertical_boundaries + horizontal_boundaries
    return BoardShape(
        orientation_bias=(
            abs(vertical_boundaries - horizontal_boundaries) / boundary_total
            if boundary_total
            else 1.0
        ),
        maximum_aspect=max(shape.aspect for shape in shapes),
        minimum_fill=min(shape.fill for shape in shapes),
        maximum_run_share=max(
            max(shape.longest_vertical, shape.longest_horizontal) / shape.area
            for shape in shapes
        ),
        maximum_run=max(
            max(shape.longest_vertical, shape.longest_horizontal)
            for shape in shapes
        ),
        vertical_boundaries=vertical_boundaries,
        horizontal_boundaries=horizontal_boundaries,
    )


def board_shape_is_natural(
    labels: Sequence[int],
    n: int,
    k: int,
    minimum_size: int,
    maximum_size: int,
) -> bool:
    members: list[list[int]] = [[] for _ in range(n)]
    for value, region in enumerate(labels):
        if region < 0 or region >= n:
            return False
        members[region].append(value)
    if any(
        not region_shape_is_natural(
            region_shape(values, n),
            n,
            k,
            minimum_size,
            maximum_size,
        )
        for values in members
    ):
        return False
    # This catches both vertical-strip and horizontal-strip boards. Runtime
    # rotations therefore cannot turn an accepted board into a strip board.
    return board_shape(labels, n).orientation_bias <= (0.46 if n <= 6 else 0.30)


def natural_size_limits(n: int, k: int) -> tuple[int, int]:
    return (
        max(2 * k + 1, math.floor(n * 0.52)),
        max(2 * k + 2, math.ceil(n * 1.72)),
    )


def spread_seeds(n: int, rng: random.Random) -> list[int]:
    """Randomized farthest-point seeds for compact, non-grid Voronoi blobs."""
    available = list(range(n * n))
    seeds = [rng.choice(available)]
    available.remove(seeds[0])
    while len(seeds) < n:
        sample_size = min(len(available), max(64, n * 5))
        candidates = rng.sample(available, sample_size)

        def candidate_score(value: int) -> float:
            row, col = divmod(value, n)
            nearest = min(
                (row - seed // n) ** 2 + (col - seed % n) ** 2
                for seed in seeds
            )
            # Keep the blue-noise spacing, but avoid a regular seed lattice.
            return nearest * rng.uniform(0.72, 1.28)

        chosen = max(candidates, key=candidate_score)
        seeds.append(chosen)
        available.remove(chosen)
    rng.shuffle(seeds)
    return seeds


def voronoi_labels(n: int, seeds: Sequence[int], rng: random.Random) -> list[int]:
    labels = [-1] * (n * n)
    seed_order = list(range(n))
    for value in range(n * n):
        row, col = divmod(value, n)
        rng.shuffle(seed_order)
        labels[value] = min(
            seed_order,
            key=lambda region: (
                (row - seeds[region] // n) ** 2 + (col - seeds[region] % n) ** 2,
                seed_order.index(region),
            ),
        )
    return labels


def generate_blob_regions(
    n: int,
    k: int,
    rng: random.Random,
    attempts: int = 2_000,
) -> tuple[list[int], list[int], BoardShape]:
    minimum_size, maximum_size = natural_size_limits(n, k)
    topology = BoardTopology.build(n)
    for _ in range(attempts):
        labels = voronoi_labels(n, spread_seeds(n, rng), rng)
        state = RegionState(topology, labels)
        if not state.validate_connected():
            continue
        sizes = [len(values) for values in state.members]
        if not board_shape_is_natural(labels, n, k, minimum_size, maximum_size):
            continue
        return labels, sizes, board_shape(labels, n)
    raise RuntimeError(f"could not grow a natural blob partition for {n}x{n}")


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


def natural_swap_score(
    state: RegionState,
    left: int,
    right: int,
    k: int,
    minimum_size: int,
    maximum_size: int,
) -> float | None:
    a = state.labels[left]
    b = state.labels[right]
    if a == b:
        return None
    next_a = [value for value in state.members[a] if value != left] + [right]
    next_b = [value for value in state.members[b] if value != right] + [left]
    shape_a = region_shape(next_a, state.n)
    shape_b = region_shape(next_b, state.n)
    if not region_shape_is_natural(shape_a, state.n, k, minimum_size, maximum_size):
        return None
    if not region_shape_is_natural(shape_b, state.n, k, minimum_size, maximum_size):
        return None
    return region_shape_penalty(shape_a) + region_shape_penalty(shape_b)


def natural_move_score(
    state: RegionState,
    value: int,
    destination: int,
    k: int,
    minimum_size: int,
    maximum_size: int,
) -> float | None:
    source = state.labels[value]
    if source == destination:
        return None
    next_source = [member for member in state.members[source] if member != value]
    next_destination = list(state.members[destination]) + [value]
    source_shape = region_shape(next_source, state.n)
    destination_shape = region_shape(next_destination, state.n)
    if not region_shape_is_natural(
        source_shape,
        state.n,
        k,
        minimum_size,
        maximum_size,
    ):
        return None
    if not region_shape_is_natural(
        destination_shape,
        state.n,
        k,
        minimum_size,
        maximum_size,
    ):
        return None
    return region_shape_penalty(source_shape) + region_shape_penalty(destination_shape)


def target_region_counts(
    state: RegionState,
    target: Sequence[int],
) -> list[int]:
    counts = [0] * state.n
    for value, selected in enumerate(target):
        if selected:
            counts[state.labels[value]] += 1
    return counts


def find_balancing_swap(
    state: RegionState,
    target: Sequence[int],
    counts: Sequence[int],
    k: int,
    rng: random.Random,
    minimum_size: int,
    maximum_size: int,
) -> tuple[int, int] | None:
    adjacency: list[set[int]] = [set() for _ in range(state.n)]
    for value in range(state.n * state.n):
        source = state.labels[value]
        for neighbor in state.topology.n4[value]:
            destination = state.labels[neighbor]
            if source != destination:
                adjacency[source].add(destination)

    distance = [state.n + 1] * state.n
    queue = deque()
    for region, count in enumerate(counts):
        if count < k:
            distance[region] = 0
            queue.append(region)
    while queue:
        region = queue.popleft()
        for neighbor in adjacency[region]:
            if distance[neighbor] > distance[region] + 1:
                distance[neighbor] = distance[region] + 1
                queue.append(neighbor)

    surplus = [region for region, count in enumerate(counts) if count > k]
    for _ in range(max(1_000, state.n * state.n * 3)):
        if not surplus:
            return None
        source = rng.choice(surplus)
        left_candidates = [
            value
            for value in state.members[source]
            if target[value] and state.removal_ok(source, value)
        ]
        if not left_candidates:
            continue
        left = rng.choice(left_candidates)
        destinations = {
            state.labels[neighbor]
            for neighbor in state.topology.n4[left]
            if state.labels[neighbor] != source
            and counts[state.labels[neighbor]] <= k
            and distance[state.labels[neighbor]] < distance[source]
        }
        if not destinations:
            continue
        destination = rng.choice(tuple(destinations))
        right_candidates = [
            value
            for value in state.members[destination]
            if not target[value]
            and state.removal_ok(destination, value)
            and state.has_neighbor_label(value, source, left)
            and state.has_neighbor_label(left, destination, value)
        ]
        if not right_candidates:
            continue
        right = rng.choice(right_candidates)
        if natural_swap_score(
            state,
            left,
            right,
            k,
            minimum_size,
            maximum_size,
        ) is not None:
            return left, right
    return None


def find_balancing_move(
    state: RegionState,
    target: Sequence[int],
    counts: Sequence[int],
    k: int,
    rng: random.Random,
    minimum_size: int,
    maximum_size: int,
) -> tuple[int, int] | None:
    adjacency: list[set[int]] = [set() for _ in range(state.n)]
    for value in range(state.n * state.n):
        source = state.labels[value]
        for neighbor in state.topology.n4[value]:
            destination = state.labels[neighbor]
            if source != destination:
                adjacency[source].add(destination)
    distance = [state.n + 1] * state.n
    queue = deque()
    for region, count in enumerate(counts):
        if count < k:
            distance[region] = 0
            queue.append(region)
    while queue:
        region = queue.popleft()
        for neighbor in adjacency[region]:
            if distance[neighbor] > distance[region] + 1:
                distance[neighbor] = distance[region] + 1
                queue.append(neighbor)

    surplus = [region for region, count in enumerate(counts) if count > k]
    for _ in range(max(1_000, state.n * state.n * 3)):
        if not surplus:
            return None
        source = rng.choice(surplus)
        candidates = [
            value
            for value in state.members[source]
            if target[value] and state.removal_ok(source, value)
        ]
        if not candidates:
            continue
        value = rng.choice(candidates)
        destinations = {
            state.labels[neighbor]
            for neighbor in state.topology.n4[value]
            if state.labels[neighbor] != source
            and counts[state.labels[neighbor]] <= k
            and distance[state.labels[neighbor]] < distance[source]
        }
        if not destinations:
            continue
        destination = rng.choice(tuple(destinations))
        if natural_move_score(
            state,
            value,
            destination,
            k,
            minimum_size,
            maximum_size,
        ) is not None:
            return value, destination
    return None


def generate_target_aware_blob_regions(
    n: int,
    k: int,
    topology: BoardTopology,
    target: Sequence[int],
    rng: random.Random,
    attempts: int = 250,
) -> tuple[RegionState, list[int], BoardShape] | None:
    minimum_size, maximum_size = natural_size_limits(n, k)
    for _ in range(attempts):
        labels, _, _ = generate_blob_regions(n, k, rng)
        state = RegionState(topology, labels)
        counts = target_region_counts(state, target)
        neutral_rounds = 0
        for _step in range(n * n * 12):
            if all(count == k for count in counts):
                if board_shape_is_natural(
                    state.labels,
                    n,
                    k,
                    minimum_size,
                    maximum_size,
                ):
                    sizes = [len(values) for values in state.members]
                    return state, sizes, board_shape(state.labels, n)
                break

            balancing_swap = find_balancing_swap(
                state,
                target,
                counts,
                k,
                rng,
                minimum_size,
                maximum_size,
            )
            balancing_move = (
                None
                if balancing_swap is not None
                else find_balancing_move(
                    state,
                    target,
                    counts,
                    k,
                    rng,
                    minimum_size,
                    maximum_size,
                )
            )
            if balancing_swap is not None:
                left, right = balancing_swap
                source = state.labels[left]
                destination = state.labels[right]
                state.swap(left, right)
                counts[source] -= 1
                counts[destination] += 1
                neutral_rounds = 0
                continue
            if balancing_move is not None:
                value, destination = balancing_move
                source = state.labels[value]
                state.move(value, destination)
                counts[source] -= 1
                counts[destination] += 1
                neutral_rounds = 0
                continue

            if neutral_rounds >= 8:
                break
            neutral_rounds += 1
            random_preserving_mix(
                state,
                rng,
                max(400, n * n * 4),
                [target],
                k,
                minimum_size,
                maximum_size,
            )
            random_preserving_empty_moves(
                state,
                rng,
                max(400, n * n * 4),
                [target],
                k,
                minimum_size,
                maximum_size,
            )
            counts = target_region_counts(state, target)
    return None


def random_preserving_mix(
    state: RegionState,
    rng: random.Random,
    attempts: int,
    preserved_solutions: Sequence[Sequence[int]],
    k: int,
    minimum_size: int,
    maximum_size: int,
    invalidity_guard: "InvalidityGuard | None" = None,
) -> int:
    accepted = 0
    n = state.n
    for _ in range(attempts):
        left = rng.randrange(n * n)
        a = state.labels[left]
        neighboring_regions = {
            state.labels[neighbor]
            for neighbor in state.topology.n4[left]
            if state.labels[neighbor] != a
        }
        if not neighboring_regions:
            continue
        b = rng.choice(tuple(neighboring_regions))
        right_candidates = [
            value
            for value in state.members[b]
            if state.has_neighbor_label(value, a)
            and all(
                solution[left] == solution[value]
                for solution in preserved_solutions
            )
        ]
        if not right_candidates:
            continue
        right = rng.choice(right_candidates)
        if not state.has_neighbor_label(left, b, right):
            continue
        if not state.has_neighbor_label(right, a, left):
            continue
        if not state.removal_ok(a, left) or not state.removal_ok(b, right):
            continue
        if natural_swap_score(
            state,
            left,
            right,
            k,
            minimum_size,
            maximum_size,
        ) is None:
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
    k: int,
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
        if natural_move_score(
            state,
            value,
            destination,
            k,
            minimum_size,
            maximum_size,
        ) is None:
            continue
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
    objective_weights: Sequence[int] | None = None,
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

    if objective_weights is not None:
        if len(objective_weights) != n * n:
            raise ValueError("objective has the wrong dimensions")
        model.maximize(
            sum(weight * variables[value] for value, weight in enumerate(objective_weights))
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
    objective_weights: Sequence[int] | None = None,
    clues: dict[int, int] | None = None,
) -> SolveResult:
    model, variables = build_cp_model(
        n,
        k,
        topology,
        labels,
        blocked_solution,
        objective_weights,
        clues,
    )
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = timeout
    solver.parameters.num_search_workers = workers
    solver.parameters.random_seed = seed & 0x7FFFFFFF
    solver.parameters.randomize_search = True
    started = time.perf_counter()
    status = solver.solve(model)
    elapsed = time.perf_counter() - started
    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        solution = [int(solver.value(variable)) for variable in variables]
    else:
        solution = None
    return SolveResult(status=status, solution=solution, elapsed_seconds=elapsed)


@dataclass(frozen=True)
class PoolSolveResult:
    status: int
    solutions: list[list[int]]
    elapsed_seconds: float


class SolutionPoolCallback(cp_model.CpSolverSolutionCallback):
    def __init__(self, variables: Sequence[cp_model.IntVar], limit: int):
        super().__init__()
        self.variables = variables
        self.limit = limit
        self.solutions: list[list[int]] = []

    def on_solution_callback(self) -> None:
        self.solutions.append([int(self.value(variable)) for variable in self.variables])
        if len(self.solutions) >= self.limit:
            self.stop_search()


def solve_pool(
    n: int,
    k: int,
    topology: BoardTopology,
    labels: Sequence[int],
    blocked_solution: Sequence[int],
    timeout: float,
    seed: int,
    limit: int,
    clues: dict[int, int] | None = None,
) -> PoolSolveResult:
    model, variables = build_cp_model(
        n,
        k,
        topology,
        labels,
        blocked_solution,
        clues=clues,
    )
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = timeout
    solver.parameters.num_search_workers = 1
    solver.parameters.random_seed = seed & 0x7FFFFFFF
    solver.parameters.randomize_search = True
    solver.parameters.enumerate_all_solutions = True
    callback = SolutionPoolCallback(variables, limit)
    started = time.perf_counter()
    status = solver.solve(model, callback)
    return PoolSolveResult(
        status=status,
        solutions=callback.solutions,
        elapsed_seconds=time.perf_counter() - started,
    )


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


@dataclass(frozen=True)
class SolutionPattern:
    maximum_translation_overlap: float
    maximum_axis_period: float
    minimum_axis_diversity: float
    checkerboard_share: float
    dominant_gap_share: float


def axis_patterns(solution: Sequence[int], n: int, transpose: bool) -> list[tuple[int, ...]]:
    return [
        tuple(
            other
            for other in range(n)
            if solution[
                cell(n, other, index) if transpose else cell(n, index, other)
            ]
        )
        for index in range(n)
    ]


def solution_pattern(solution: Sequence[int], n: int, k: int) -> SolutionPattern:
    holes = {value for value, selected in enumerate(solution) if selected}
    maximum_translation_overlap = 0.0
    for dr in range(1, min(7, n)):
        for dc in range(-min(8, n - 1), min(8, n - 1) + 1):
            matches = 0
            for value in holes:
                row, col = divmod(value, n)
                rr, cc = row + dr, col + dc
                if 0 <= rr < n and 0 <= cc < n and cell(n, rr, cc) in holes:
                    matches += 1
            maximum_translation_overlap = max(
                maximum_translation_overlap,
                matches / max(1, len(holes)),
            )

    row_patterns = axis_patterns(solution, n, False)
    col_patterns = axis_patterns(solution, n, True)
    maximum_axis_period = 0.0
    for patterns in (row_patterns, col_patterns):
        for period in range(2, min(7, n)):
            matches = sum(
                patterns[index] == patterns[index - period]
                for index in range(period, n)
            )
            maximum_axis_period = max(
                maximum_axis_period,
                matches / max(1, n - period),
            )

    minimum_axis_diversity = min(
        len(set(row_patterns)) / n,
        len(set(col_patterns)) / n,
    )
    parity_counts = [0, 0, 0, 0]
    for value in holes:
        row, col = divmod(value, n)
        parity_counts[(row % 2) * 2 + col % 2] += 1
    checkerboard_share = max(parity_counts) / max(1, len(holes))

    gaps: list[int] = []
    for patterns in (row_patterns, col_patterns):
        for positions in patterns:
            gaps.extend(right - left for left, right in zip(positions, positions[1:]))
    if gaps:
        frequencies = {gap: gaps.count(gap) for gap in set(gaps)}
        dominant_gap_share = max(frequencies.values()) / len(gaps)
    else:
        dominant_gap_share = 0.0

    return SolutionPattern(
        maximum_translation_overlap=maximum_translation_overlap,
        maximum_axis_period=maximum_axis_period,
        minimum_axis_diversity=minimum_axis_diversity,
        checkerboard_share=checkerboard_share,
        dominant_gap_share=dominant_gap_share,
    )


def solution_pattern_is_irregular(pattern: SolutionPattern, n: int, k: int) -> bool:
    if n <= 6:
        return pattern.maximum_translation_overlap <= 0.75
    maximum_overlap = 0.56 if n <= 10 else 0.46
    if pattern.maximum_translation_overlap > maximum_overlap:
        return False
    if pattern.maximum_axis_period > (0.55 if n <= 10 else 0.34):
        return False
    if k > 1 and n >= 12 and pattern.minimum_axis_diversity < 0.72:
        return False
    if k > 1 and n >= 12 and pattern.checkerboard_share > 0.62:
        return False
    if k > 1 and pattern.dominant_gap_share > 0.72:
        return False
    return True


def pattern_score(pattern: SolutionPattern) -> float:
    return (
        5.0 * pattern.maximum_translation_overlap
        + 3.0 * pattern.maximum_axis_period
        + 2.0 * (1.0 - pattern.minimum_axis_diversity)
        + 1.5 * pattern.checkerboard_share
        + pattern.dominant_gap_share
    )


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


def killing_swap_candidates(
    state: RegionState,
    target: Sequence[int],
    counterexamples: Sequence[Sequence[int]],
    rng: random.Random,
    k: int,
    minimum_size: int,
    maximum_size: int,
    invalidity_guard: InvalidityGuard | None = None,
    limit: int = 16,
) -> list[tuple[int, int]]:
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

    candidates: list[tuple[int, float, int, int]] = []
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
                    kill_count = sum(
                        counterexample[left] != counterexample[right]
                        for counterexample in counterexamples
                    )
                    if kill_count <= 0:
                        continue
                    if not state.has_neighbor_label(left, b, right):
                        continue
                    if not state.has_neighbor_label(right, a, left):
                        continue
                    if invalidity_guard is not None and not invalidity_guard.allows_swap(
                        state, left, right
                    ):
                        continue
                    shape_score = natural_swap_score(
                        state,
                        left,
                        right,
                        k,
                        minimum_size,
                        maximum_size,
                    )
                    if shape_score is None:
                        continue
                    candidates.append(
                        (-kill_count, shape_score + rng.random() * 0.75, left, right)
                    )
    return [
        (left, right)
        for _, _, left, right in sorted(candidates)[:limit]
    ]


def killing_move_candidates(
    state: RegionState,
    target: Sequence[int],
    counterexamples: Sequence[Sequence[int]],
    rng: random.Random,
    k: int,
    minimum_size: int,
    maximum_size: int,
    invalidity_guard: InvalidityGuard | None = None,
    limit: int = 16,
) -> list[tuple[int, int]]:
    """Move an S-empty/T-hole boundary cell; this preserves S and kills T."""
    candidates: list[tuple[int, float, int, int]] = []
    for value in range(state.n * state.n):
        source = state.labels[value]
        if target[value]:
            continue
        kill_count = sum(counterexample[value] for counterexample in counterexamples)
        if kill_count <= 0:
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
            shape_score = natural_move_score(
                state,
                value,
                destination,
                k,
                minimum_size,
                maximum_size,
            )
            if shape_score is None:
                continue
            candidates.append(
                (-kill_count, shape_score + rng.random() * 0.75, value, destination)
            )
    return [
        (value, destination)
        for _, _, value, destination in sorted(candidates)[:limit]
    ]


def choose_killing_edit(
    state: RegionState,
    target: Sequence[int],
    counterexamples: Sequence[Sequence[int]],
    rng: random.Random,
    k: int,
    minimum_size: int,
    maximum_size: int,
    invalidity_guard: InvalidityGuard,
    topology: BoardTopology,
    timeout: float,
    workers: int,
) -> tuple[str, int, int] | None:
    swaps = killing_swap_candidates(
        state,
        target,
        counterexamples,
        rng,
        k,
        minimum_size,
        maximum_size,
        invalidity_guard,
    )
    moves = killing_move_candidates(
        state,
        target,
        counterexamples,
        rng,
        k,
        minimum_size,
        maximum_size,
        invalidity_guard,
    )
    options = [
        *(("swap", left, right) for left, right in swaps),
        *(("move", value, destination) for value, destination in moves),
    ]
    if not options:
        return None

    # Near the end, several shape-safe edits can all kill the visible second
    # solution, but only some avoid opening a new one. Briefly look ahead and
    # prefer an edit that makes the blocked model immediately infeasible.
    if len(counterexamples) <= 4:
        for kind, first, second in options[:4]:
            if kind == "swap":
                state.swap(first, second)
                proof = solve_one(
                    state.n,
                    k,
                    topology,
                    state.labels,
                    target,
                    min(timeout, 0.35),
                    workers,
                    rng.randrange(1 << 31),
                )
                state.swap(first, second)
            else:
                source = state.labels[first]
                state.move(first, second)
                proof = solve_one(
                    state.n,
                    k,
                    topology,
                    state.labels,
                    target,
                    min(timeout, 0.35),
                    workers,
                    rng.randrange(1 << 31),
                )
                state.move(first, source)
            if proof.status == cp_model.INFEASIBLE:
                return kind, first, second
    return options[0]


@dataclass(frozen=True)
class HittingSetResult:
    cells: tuple[int, ...]
    minimum_count: int
    elapsed_seconds: float


@dataclass(frozen=True)
class ExclusionClueResult:
    clues: dict[int, int]
    proof_seconds: float
    minimum_proof_seconds: float
    counterexample_count: int
    iterations: int


def solve_minimum_hitting_set(
    candidate_cells: Sequence[int],
    counterexample_supports: Sequence[frozenset[int]],
    timeout: float,
    workers: int,
    seed: int,
) -> HittingSetResult:
    """Return a proved minimum set of target-empty cells hitting every support."""
    if not counterexample_supports:
        return HittingSetResult(cells=(), minimum_count=0, elapsed_seconds=0.0)

    model = cp_model.CpModel()
    variables = {
        value: model.new_bool_var(f"exclude_{value}")
        for value in candidate_cells
    }
    coverage = {value: 0 for value in candidate_cells}
    for support in counterexample_supports:
        supported_variables = [variables[value] for value in support if value in variables]
        if not supported_variables:
            raise RuntimeError("a different solution adds no hole on a target-empty cell")
        model.add(sum(supported_variables) >= 1)
        for value in support:
            if value in coverage:
                coverage[value] += 1

    clue_count = sum(variables.values())
    model.minimize(clue_count)
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = timeout
    solver.parameters.num_search_workers = workers
    solver.parameters.random_seed = seed & 0x7FFFFFFF
    solver.parameters.randomize_search = True
    started = time.perf_counter()
    status = solver.solve(model)
    elapsed = time.perf_counter() - started
    if status != cp_model.OPTIMAL:
        raise RuntimeError(
            "minimum exclusion hitting-set proof was inconclusive "
            f"({solver.status_name(status)})"
        )

    minimum_count = int(round(solver.objective_value))
    selected = tuple(
        value for value in candidate_cells if solver.value(variables[value])
    )

    # The first solve proves the minimum cardinality. Among equally small sets,
    # prefer cells that cover many already-known alternatives; this usually
    # reduces the number of counterexample rounds without weakening the proof.
    model.add(clue_count == minimum_count)
    model.maximize(
        sum(coverage[value] * variables[value] for value in candidate_cells)
    )
    tie_solver = cp_model.CpSolver()
    tie_solver.parameters.max_time_in_seconds = min(timeout, 30.0)
    tie_solver.parameters.num_search_workers = workers
    tie_solver.parameters.random_seed = (seed ^ 0x6A09E667) & 0x7FFFFFFF
    tie_solver.parameters.randomize_search = True
    tie_started = time.perf_counter()
    tie_status = tie_solver.solve(model)
    elapsed += time.perf_counter() - tie_started
    if tie_status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        selected = tuple(
            value
            for value in candidate_cells
            if tie_solver.value(variables[value])
        )
    if len(selected) != minimum_count:
        raise RuntimeError("minimum hitting-set solver returned the wrong cardinality")
    return HittingSetResult(
        cells=selected,
        minimum_count=minimum_count,
        elapsed_seconds=elapsed,
    )


def make_unique_with_minimum_exclusions(
    n: int,
    k: int,
    topology: BoardTopology,
    labels: Sequence[int],
    target: Sequence[int],
    rng: random.Random,
    timeout: float,
    workers: int,
    pool_size: int,
) -> ExclusionClueResult:
    """Compute exclusion-only givens and prove their count globally minimum."""
    candidate_cells = tuple(
        value for value, is_hole in enumerate(target) if not is_hole
    )
    counterexample_supports: list[frozenset[int]] = []
    seen_supports: set[frozenset[int]] = set()
    selected: tuple[int, ...] = ()
    minimum_proof_seconds = 0.0
    proof_seconds = 0.0
    iterations = 0

    while True:
        clues = {value: 0 for value in selected}
        pool = solve_pool(
            n,
            k,
            topology,
            labels,
            target,
            min(timeout, 1.5 if n >= 28 else 3.0),
            rng.randrange(1 << 31),
            pool_size,
            clues,
        )
        alternatives = pool.solutions
        if not alternatives:
            proof = solve_one(
                n,
                k,
                topology,
                labels,
                target,
                timeout,
                workers,
                rng.randrange(1 << 31),
                clues=clues,
            )
            proof_seconds = proof.elapsed_seconds
            if proof.status == cp_model.INFEASIBLE:
                # Every globally unique exclusion set must hit every collected
                # counterexample. The selected set is an OPTIMAL hitting set
                # for that unavoidable family and it eliminates all remaining
                # alternatives, so its cardinality is globally minimum.
                return ExclusionClueResult(
                    clues=clues,
                    proof_seconds=proof_seconds,
                    minimum_proof_seconds=minimum_proof_seconds,
                    counterexample_count=len(counterexample_supports),
                    iterations=iterations,
                )
            if proof.solution is None:
                raise RuntimeError(
                    "minimum exclusion uniqueness proof was inconclusive "
                    f"({cp_model.CpSolver().status_name(proof.status)})"
                )
            alternatives = [proof.solution]

        added = 0
        for alternative in alternatives:
            support = frozenset(
                value for value in candidate_cells if alternative[value]
            )
            if not support:
                raise RuntimeError(
                    "a different solution adds no hole on a target-empty cell"
                )
            if support in seen_supports:
                continue
            seen_supports.add(support)
            counterexample_supports.append(support)
            added += 1
        if added == 0:
            raise RuntimeError(
                "the alternative-solution search repeated an already-hit support"
            )

        hitting_set = solve_minimum_hitting_set(
            candidate_cells,
            counterexample_supports,
            timeout,
            workers,
            rng.randrange(1 << 31),
        )
        minimum_proof_seconds += hitting_set.elapsed_seconds
        selected = hitting_set.cells
        iterations += 1
        print(
            "    minimum exclusions "
            f"round={iterations}, alternatives={len(counterexample_supports)}, "
            f"lower-bound={hitting_set.minimum_count}",
            flush=True,
        )


@dataclass(frozen=True)
class TargetResult:
    solution: list[int]
    pattern: SolutionPattern
    attempts: int


def find_irregular_target(
    n: int,
    k: int,
    topology: BoardTopology,
    labels: Sequence[int] | None,
    rng: random.Random,
    timeout: float,
    workers: int,
    attempts: int,
) -> TargetResult | None:
    best: tuple[float, TargetResult] | None = None
    for attempt in range(1, attempts + 1):
        weights = [rng.randrange(1, 1_000_000) for _ in range(n * n)]
        result = solve_one(
            n,
            k,
            topology,
            labels,
            None,
            timeout,
            workers,
            rng.randrange(1 << 31),
            objective_weights=weights,
        )
        if result.solution is None:
            if result.status == cp_model.INFEASIBLE:
                return None
            continue
        pattern = solution_pattern(result.solution, n, k)
        candidate = TargetResult(result.solution, pattern, attempt)
        score = pattern_score(pattern)
        if best is None or score < best[0]:
            best = (score, candidate)
        if solution_pattern_is_irregular(pattern, n, k):
            return candidate
    if best is not None:
        pattern = best[1].pattern
        print(
            "  best rejected target: "
            f"translation={pattern.maximum_translation_overlap:.3f}, "
            f"period={pattern.maximum_axis_period:.3f}, "
            f"diversity={pattern.minimum_axis_diversity:.3f}, "
            f"checker={pattern.checkerboard_share:.3f}, "
            f"gap={pattern.dominant_gap_share:.3f}",
            flush=True,
        )
    return None


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
    guard_limit: int
    target_attempts: int
    pool_size: int


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
    minimum_size, maximum_size = natural_size_limits(n, k)

    for restart in range(1, settings.restarts + 1):
        target_result: TargetResult | None
        if n >= 12:
            print(
                f"[{difficulty_id}] restart={restart} finding independent irregular target",
                flush=True,
            )
            target_result = find_irregular_target(
                n,
                k,
                topology,
                None,
                rng,
                settings.find_time,
                settings.workers,
                settings.target_attempts,
            )
            if target_result is None:
                print("  no irregular independent target; restarting", flush=True)
                continue
            balanced = generate_target_aware_blob_regions(
                n,
                k,
                topology,
                target_result.solution,
                rng,
            )
            if balanced is None:
                print("  could not balance natural blobs around the target; restarting", flush=True)
                continue
            state, sizes, initial_shape = balanced
            print(
                f"  target-aware blobs sizes={min(sizes)}..{max(sizes)} "
                f"orientation={initial_shape.orientation_bias:.3f}",
                flush=True,
            )
        else:
            labels, sizes, initial_shape = generate_blob_regions(n, k, rng)
            state = RegionState(topology, labels)
            print(
                f"[{difficulty_id}] restart={restart} blob sizes={min(sizes)}..{max(sizes)} "
                f"orientation={initial_shape.orientation_bias:.3f}; "
                "finding irregular target",
                flush=True,
            )
            target_result = find_irregular_target(
                n,
                k,
                topology,
                state.labels,
                rng,
                settings.find_time,
                settings.workers,
                settings.target_attempts,
            )
        if target_result is None:
            print("  no irregular target for this blob partition; restarting", flush=True)
            continue
        target = target_result.solution
        pattern = target_result.pattern
        assert solution_is_valid(n, k, topology, state.labels, target)
        print(
            f"  target attempt={target_result.attempts}, "
            f"translation={pattern.maximum_translation_overlap:.3f}, "
            f"period={pattern.maximum_axis_period:.3f}, "
            f"diversity={pattern.minimum_axis_diversity:.3f}",
            flush=True,
        )

        accepted = random_preserving_mix(
            state,
            rng,
            max(n * n * settings.mix_factor, 200),
            [target],
            k,
            minimum_size,
            maximum_size,
        )
        moved = random_preserving_empty_moves(
            state,
            rng,
            max(n * n * settings.mix_factor, 200),
            [target],
            k,
            minimum_size,
            maximum_size,
        )
        print(
            f"  target found; preserving swaps={accepted}, empty moves={moved}",
            flush=True,
        )
        assert state.validate_connected()
        assert solution_is_valid(n, k, topology, state.labels, target)
        if not board_shape_is_natural(
            state.labels,
            n,
            k,
            minimum_size,
            maximum_size,
        ):
            print("  organic mixing crossed a shape limit; restarting", flush=True)
            continue

        proof_seconds = 0.0
        unique = False
        iterations_used = 0
        invalidity_guard = InvalidityGuard(k, settings.guard_limit)
        shape_failed = False
        stalled = False
        solve_round = 0
        while iterations_used < settings.kill_limit:
            solve_round += 1
            pool = solve_pool(
                n,
                k,
                topology,
                state.labels,
                target,
                min(settings.unique_time, 0.75),
                rng.randrange(1 << 31),
                settings.pool_size,
            )
            proof_seconds = pool.elapsed_seconds
            counterexamples = pool.solutions
            if not counterexamples:
                proof = solve_one(
                    n,
                    k,
                    topology,
                    state.labels,
                    target,
                    settings.unique_time,
                    settings.workers,
                    rng.randrange(1 << 31),
                )
                proof_seconds = proof.elapsed_seconds
                if proof.status == cp_model.INFEASIBLE:
                    unique = True
                    print(
                        f"  edits={iterations_used}, round={solve_round}: "
                        f"blocked model INFEASIBLE "
                        f"({proof_seconds:.3f}s) -- UNIQUE",
                        flush=True,
                    )
                    break
                if proof.solution is None:
                    print(
                        f"  round={solve_round}: proof inconclusive "
                        f"({cp_model.CpSolver().status_name(proof.status)})",
                        flush=True,
                    )
                    break
                counterexamples = [proof.solution]

            round_start = len(counterexamples)
            round_killed = 0
            neutral_attempts = 0
            while counterexamples and iterations_used < settings.kill_limit:
                chosen_edit = choose_killing_edit(
                    state,
                    target,
                    counterexamples,
                    rng,
                    k,
                    minimum_size,
                    maximum_size,
                    invalidity_guard,
                    topology,
                    settings.unique_time,
                    settings.workers,
                )
                if chosen_edit is None and neutral_attempts < 8:
                    neutral_attempts += 1
                    unlocked = random_preserving_mix(
                        state,
                        rng,
                        max(n * n * settings.unlock_factor, 200),
                        [target, counterexamples[0]],
                        k,
                        minimum_size,
                        maximum_size,
                        invalidity_guard,
                    )
                    moved = random_preserving_empty_moves(
                        state,
                        rng,
                        max(n * n * settings.unlock_factor, 200),
                        [target, counterexamples[0]],
                        k,
                        minimum_size,
                        maximum_size,
                        invalidity_guard,
                    )
                    print(
                        f"    no direct killer; neutral {neutral_attempts}/8, "
                        f"swaps={unlocked}, moves={moved}",
                        flush=True,
                    )
                    surviving: list[list[int]] = []
                    for counterexample in counterexamples:
                        if solution_is_valid(
                            n,
                            k,
                            topology,
                            state.labels,
                            counterexample,
                        ):
                            surviving.append(counterexample)
                        else:
                            invalidity_guard.add(state, counterexample)
                            round_killed += 1
                    counterexamples = surviving
                    continue
                if chosen_edit is None:
                    stalled = True
                    break

                kind, first, second = chosen_edit
                if kind == "swap":
                    left, right = first, second
                    invalidity_guard.apply_swap(state, left, right)
                    state.swap(left, right)
                else:
                    value, destination = first, second
                    invalidity_guard.apply_move(state, value, destination)
                    state.move(value, destination)
                iterations_used += 1
                assert solution_is_valid(n, k, topology, state.labels, target)
                assert state.validate_connected()

                surviving = []
                killed = 0
                eliminated: list[Sequence[int]] = []
                for counterexample in counterexamples:
                    if solution_is_valid(
                        n,
                        k,
                        topology,
                        state.labels,
                        counterexample,
                    ):
                        surviving.append(counterexample)
                    else:
                        invalidity_guard.add(state, counterexample)
                        killed += 1
                        eliminated.append(counterexample)
                assert killed > 0
                round_killed += killed
                counterexamples = surviving
                if not counterexamples and round_start <= 4 and eliminated:
                    # A lone alternative often turns into a different lone
                    # alternative after one boundary edit. Reinforce the same
                    # contradiction at several additional boundaries while
                    # the invalidity guard guarantees it cannot be repaired.
                    for _ in range(6):
                        reinforcement_swaps = killing_swap_candidates(
                            state,
                            target,
                            [eliminated[0]],
                            rng,
                            k,
                            minimum_size,
                            maximum_size,
                            invalidity_guard,
                            limit=1,
                        )
                        reinforcement_moves = killing_move_candidates(
                            state,
                            target,
                            [eliminated[0]],
                            rng,
                            k,
                            minimum_size,
                            maximum_size,
                            invalidity_guard,
                            limit=1,
                        )
                        if reinforcement_swaps:
                            left, right = reinforcement_swaps[0]
                            invalidity_guard.apply_swap(state, left, right)
                            state.swap(left, right)
                        elif reinforcement_moves:
                            value, destination = reinforcement_moves[0]
                            invalidity_guard.apply_move(state, value, destination)
                            state.move(value, destination)
                        else:
                            break
                        iterations_used += 1
                        assert solution_is_valid(
                            n,
                            k,
                            topology,
                            state.labels,
                            target,
                        )
                if not board_shape_is_natural(
                    state.labels,
                    n,
                    k,
                    minimum_size,
                    maximum_size,
                ):
                    print(
                        "    a uniqueness edit crossed the board-shape limit; restarting",
                        flush=True,
                    )
                    shape_failed = True
                    break

            print(
                f"  round={solve_round}: edits={iterations_used}, "
                f"killed={round_killed}/{round_start}, guarded="
                f"{len(invalidity_guard.guarded)}/{settings.guard_limit}",
                flush=True,
            )
            if shape_failed or stalled:
                break

        if shape_failed:
            print("  natural-shape uniqueness editing failed; restarting", flush=True)
            continue
        clues: dict[int, int] = {}
        minimum_proof_seconds = 0.0
        minimum_counterexamples = 0
        minimum_iterations = 0
        if not unique:
            clue_result = make_unique_with_minimum_exclusions(
                n,
                k,
                topology,
                state.labels,
                target,
                rng,
                settings.unique_time,
                settings.workers,
                settings.pool_size,
            )
            clues = clue_result.clues
            proof_seconds = clue_result.proof_seconds
            minimum_proof_seconds = clue_result.minimum_proof_seconds
            minimum_counterexamples = clue_result.counterexample_count
            minimum_iterations = clue_result.iterations
            unique = True
            print(
                f"  minimum exclusion fallback UNIQUE: exclusions={len(clues)}, "
                f"proof={proof_seconds:.3f}s",
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
            clues=clues,
        )
        if final_proof.status != cp_model.INFEASIBLE:
            print("  final independent rebuild was inconclusive; restarting", flush=True)
            continue

        assert state.validate_connected()
        assert solution_is_valid(n, k, topology, state.labels, target)
        assert solution_pattern_is_irregular(pattern, n, k)
        assert board_shape_is_natural(
            state.labels,
            n,
            k,
            minimum_size,
            maximum_size,
        )
        final_shape = board_shape(state.labels, n)
        return {
            "id": f"{difficulty_id}-{seed:x}",
            "difficultyId": difficulty_id,
            "name": name,
            "n": n,
            "k": k,
            "seed": str(seed),
            "regions": encode_rows(state.labels, n),
            "solution": encode_rows(target, n),
            "givens": [
                {"cell": value, "value": clues[value]}
                for value in sorted(clues)
            ],
            "certificate": {
                "kind": (
                    "cp-sat-blocked-solution-plus-minimum-visible-exclusions-infeasible"
                    if clues
                    else "cp-sat-blocked-solution-infeasible"
                ),
                "status": "INFEASIBLE",
                "ortoolsVersion": ortools_version,
                "restart": restart,
                "killIterations": iterations_used,
                "regionMethod": "spread-seed-voronoi-blobs",
                "guardLimit": settings.guard_limit,
                "clueCount": len(clues),
                "exclusionClueCount": len(clues),
                "exclusionClueMinimumProved": True,
                "proofSeconds": round(final_proof.elapsed_seconds, 6),
                "minimumProofSeconds": round(minimum_proof_seconds, 6),
                "minimumProofCounterexamples": minimum_counterexamples,
                "minimumProofIterations": minimum_iterations,
                "regionsConnected": True,
                "solutionValid": True,
                "naturalRegions": True,
                "shapeMetrics": {
                    "orientationBias": round(final_shape.orientation_bias, 6),
                    "maximumAspect": round(final_shape.maximum_aspect, 6),
                    "minimumFill": round(final_shape.minimum_fill, 6),
                    "maximumRunShare": round(final_shape.maximum_run_share, 6),
                    "maximumRun": final_shape.maximum_run,
                    "verticalBoundaries": final_shape.vertical_boundaries,
                    "horizontalBoundaries": final_shape.horizontal_boundaries,
                },
                "solutionMetrics": {
                    "maximumTranslationOverlap": round(
                        pattern.maximum_translation_overlap,
                        6,
                    ),
                    "maximumAxisPeriod": round(pattern.maximum_axis_period, 6),
                    "minimumAxisDiversity": round(pattern.minimum_axis_diversity, 6),
                    "checkerboardShare": round(pattern.checkerboard_share, 6),
                    "dominantGapShare": round(pattern.dominant_gap_share, 6),
                },
            },
        }

    raise RuntimeError(f"failed to generate {difficulty_id} within {settings.restarts} restarts")


def decode_rows(rows: Sequence[str], n: int) -> list[int]:
    if len(rows) != n or any(len(row) != n for row in rows):
        raise ValueError("encoded grid has the wrong dimensions")
    return [int(char, 36) for row in rows for char in row]


def minimum_exclusion_certificate_kind(clue_count: int) -> str:
    if clue_count:
        return "cp-sat-blocked-solution-plus-minimum-visible-exclusions-infeasible"
    return "cp-sat-blocked-solution-infeasible"


def stable_puzzle_seed(base_seed: int, puzzle_id: str) -> int:
    mixed = base_seed & 0x7FFFFFFF
    for index, character in enumerate(puzzle_id):
        mixed = (
            mixed * 1_000_003
            + (index + 1) * ord(character)
            + 0x9E3779B9
        ) & 0x7FFFFFFF
    return mixed


def read_exclusion_clues(puzzle: dict, target: Sequence[int]) -> dict[int, int]:
    if "clues" in puzzle:
        raise RuntimeError(f"{puzzle['id']}: legacy rabbit-hole clues are forbidden")
    clues: dict[int, int] = {}
    for given in puzzle.get("givens", []):
        value = int(given["cell"])
        expected = int(given["value"])
        if value in clues:
            raise RuntimeError(f"{puzzle['id']}: duplicate visible exclusion")
        if (
            value < 0
            or value >= len(target)
            or expected != 0
            or target[value] != 0
        ):
            raise RuntimeError(
                f"{puzzle['id']}: every visible given must be a target-empty exclusion"
            )
        clues[value] = 0
    return clues


def reclue_bank(
    path: Path,
    output: Path,
    timeout: float,
    workers: int,
    pool_size: int,
    seed: int,
) -> None:
    """Preserve every board and answer while replacing givens with exact minima."""
    document = json.loads(path.read_text(encoding="utf-8"))
    puzzles = document.get("puzzles", [])
    if not puzzles:
        raise RuntimeError("puzzle bank is empty")

    for puzzle in puzzles:
        n = int(puzzle["n"])
        k = int(puzzle["k"])
        labels = decode_rows(puzzle["regions"], n)
        target = decode_rows(puzzle["solution"], n)
        topology = BoardTopology.build(n)
        state = RegionState(topology, labels)
        if not state.validate_connected():
            raise RuntimeError(f"{puzzle['id']}: a region is disconnected")
        if not solution_is_valid(n, k, topology, labels, target):
            raise RuntimeError(f"{puzzle['id']}: stored solution is invalid")
        minimum_size, maximum_size = natural_size_limits(n, k)
        if not board_shape_is_natural(
            labels,
            n,
            k,
            minimum_size,
            maximum_size,
        ):
            raise RuntimeError(f"{puzzle['id']}: region shapes failed the anti-stripe gate")
        pattern = solution_pattern(target, n, k)
        if not solution_pattern_is_irregular(pattern, n, k):
            raise RuntimeError(f"{puzzle['id']}: rabbit layout is too repetitive")

        print(f"[{puzzle['id']}] computing minimum visible exclusions", flush=True)
        puzzle_rng = random.Random(stable_puzzle_seed(seed, puzzle["id"]))
        clue_result = make_unique_with_minimum_exclusions(
            n,
            k,
            topology,
            labels,
            target,
            puzzle_rng,
            timeout,
            workers,
            pool_size,
        )
        clues = clue_result.clues

        # Rebuild the final uniqueness proof independently from the CEGIS loop.
        final_proof = solve_one(
            n,
            k,
            topology,
            labels,
            target,
            timeout,
            workers,
            stable_puzzle_seed(seed ^ 0x5F3759DF, puzzle["id"]),
            clues=clues,
        )
        if final_proof.status != cp_model.INFEASIBLE:
            raise RuntimeError(
                f"{puzzle['id']}: independent exclusion-only uniqueness proof failed"
            )

        puzzle["givens"] = [
            {"cell": value, "value": 0}
            for value in sorted(clues)
        ]
        puzzle.pop("clues", None)
        certificate = puzzle.setdefault("certificate", {})
        certificate.update(
            {
                "kind": minimum_exclusion_certificate_kind(len(clues)),
                "status": "INFEASIBLE",
                "ortoolsVersion": ortools_version,
                "clueCount": len(clues),
                "exclusionClueCount": len(clues),
                "exclusionClueMinimumProved": True,
                "proofSeconds": round(final_proof.elapsed_seconds, 6),
                "minimumProofSeconds": round(
                    clue_result.minimum_proof_seconds
                    + clue_result.proof_seconds,
                    6,
                ),
                "minimumProofCounterexamples": clue_result.counterexample_count,
                "minimumProofIterations": clue_result.iterations,
                "regionsConnected": True,
                "solutionValid": True,
                "naturalRegions": True,
            }
        )
        print(
            f"  UNIQUE with globally minimum exclusions={len(clues)} "
            f"(counterexamples={clue_result.counterexample_count})",
            flush=True,
        )

    document["schemaVersion"] = 4
    document["generator"] = "three_holes_unique_generator.py"
    document["algorithm"] = (
        "certified-natural-blobs-with-irregular-targets-and-minimum-visible-exclusions"
    )
    document["ortoolsVersion"] = ortools_version
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(document, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"reclued {len(puzzles)} certified puzzle(s) into {output}")


def verify_bank(
    path: Path,
    timeout: float,
    workers: int,
    pool_size: int,
    seed: int,
    prove_minimum: bool,
) -> None:
    document = json.loads(path.read_text(encoding="utf-8"))
    puzzles = document.get("puzzles", [])
    if not puzzles:
        raise RuntimeError("puzzle bank is empty")
    if int(document.get("schemaVersion", 0)) < 4:
        raise RuntimeError("puzzle bank does not use exclusion-only schema version 4")

    for puzzle in puzzles:
        n = int(puzzle["n"])
        k = int(puzzle["k"])
        labels = decode_rows(puzzle["regions"], n)
        target = decode_rows(puzzle["solution"], n)
        clues = read_exclusion_clues(puzzle, target)
        certificate = puzzle.get("certificate", {})
        certificate_count = int(puzzle.get("certificate", {}).get("clueCount", len(clues)))
        if certificate_count != len(clues):
            raise RuntimeError(
                f"{puzzle['id']}: visible exclusion count does not match its certificate"
            )
        if int(certificate.get("exclusionClueCount", -1)) != len(clues):
            raise RuntimeError(
                f"{puzzle['id']}: exclusion clue count does not match its certificate"
            )
        if certificate.get("exclusionClueMinimumProved") is not True:
            raise RuntimeError(
                f"{puzzle['id']}: minimum exclusion clue count was not certified"
            )
        if certificate.get("kind") != minimum_exclusion_certificate_kind(len(clues)):
            raise RuntimeError(f"{puzzle['id']}: exclusion certificate kind is invalid")
        topology = BoardTopology.build(n)
        state = RegionState(topology, labels)
        if not state.validate_connected():
            raise RuntimeError(f"{puzzle['id']}: a region is disconnected")
        if not solution_is_valid(n, k, topology, labels, target):
            raise RuntimeError(f"{puzzle['id']}: stored solution is invalid")
        minimum_size, maximum_size = natural_size_limits(n, k)
        if not board_shape_is_natural(
            labels,
            n,
            k,
            minimum_size,
            maximum_size,
        ):
            raise RuntimeError(f"{puzzle['id']}: region shapes failed the anti-stripe gate")
        pattern = solution_pattern(target, n, k)
        if not solution_pattern_is_irregular(pattern, n, k):
            raise RuntimeError(f"{puzzle['id']}: rabbit layout is too repetitive")

        result = solve_one(
            n,
            k,
            topology,
            labels,
            target,
            timeout,
            workers,
            0x51A7,
            clues=clues,
        )
        status_name = cp_model.CpSolver().status_name(result.status)
        print(f"[{puzzle['id']}] blocked model: {status_name} ({result.elapsed_seconds:.3f}s)")
        if result.status != cp_model.INFEASIBLE:
            raise RuntimeError(f"{puzzle['id']}: uniqueness was not proved")
        if prove_minimum:
            minimum_result = make_unique_with_minimum_exclusions(
                n,
                k,
                topology,
                labels,
                target,
                random.Random(stable_puzzle_seed(seed, puzzle["id"])),
                timeout,
                workers,
                pool_size,
            )
            if len(minimum_result.clues) != len(clues):
                raise RuntimeError(
                    f"{puzzle['id']}: stored exclusions={len(clues)}, "
                    f"proved minimum={len(minimum_result.clues)}"
                )
            print(
                f"[{puzzle['id']}] minimum exclusions: {len(clues)} "
                f"(counterexamples={minimum_result.counterexample_count})",
                flush=True,
            )


def merge_banks(paths: Sequence[Path], output: Path) -> None:
    by_difficulty: dict[str, list[dict]] = defaultdict(list)
    seen_ids: set[str] = set()
    for path in paths:
        document = json.loads(path.read_text(encoding="utf-8"))
        for puzzle in document.get("puzzles", []):
            difficulty_id = puzzle["difficultyId"]
            if puzzle["id"] in seen_ids:
                raise RuntimeError(f"duplicate puzzle id {puzzle['id']}")
            seen_ids.add(puzzle["id"])
            target = decode_rows(puzzle["solution"], int(puzzle["n"]))
            read_exclusion_clues(puzzle, target)
            by_difficulty[difficulty_id].append(puzzle)

    expected = [difficulty[0] for difficulty in DIFFICULTIES]
    missing = [difficulty_id for difficulty_id in expected if not by_difficulty[difficulty_id]]
    if missing:
        raise RuntimeError(f"missing puzzle(s): {', '.join(missing)}")

    document = {
        "schemaVersion": 4,
        "generator": "three_holes_unique_generator.py",
        "algorithm": (
            "certified-natural-blobs-with-irregular-targets-and-minimum-visible-exclusions"
        ),
        "ortoolsVersion": ortools_version,
        "puzzles": [
            puzzle
            for difficulty_id in expected
            for puzzle in sorted(by_difficulty[difficulty_id], key=lambda item: item["id"])
        ],
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(document, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"merged {len(document['puzzles'])} certified puzzles into {output}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate Three Holes boards whose uniqueness is proved by OR-Tools CP-SAT.",
    )
    parser.add_argument("--difficulty", action="append", help="difficulty id; repeatable (default: all)")
    parser.add_argument("--seed", type=int, default=0xC0D3_2026_0723)
    parser.add_argument("--output", type=Path, default=Path("src/game/threeHoles/puzzles.generated.json"))
    parser.add_argument("--verify", type=Path, help="verify an existing generated JSON bank instead")
    parser.add_argument(
        "--reclue",
        type=Path,
        help="preserve boards and answers while recomputing minimum exclusion-only givens",
    )
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
    parser.add_argument("--kill-limit", type=int, default=1_000)
    parser.add_argument("--mix-factor", type=int, default=8)
    parser.add_argument("--unlock-factor", type=int, default=10)
    parser.add_argument("--target-attempts", type=int, default=24)
    parser.add_argument("--variants", type=int, default=2)
    parser.add_argument("--pool-size", type=int, default=128)
    parser.add_argument(
        "--skip-minimum-proof",
        action="store_true",
        help="during --verify, trust the recorded minimum proof after checking uniqueness",
    )
    parser.add_argument(
        "--guard-limit",
        type=int,
        default=2_000,
        help="maximum prior counterexamples protected from resurrection",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    selected_modes = sum(
        mode is not None for mode in (args.verify, args.reclue, args.merge)
    )
    if selected_modes > 1:
        raise ValueError("--verify, --reclue, and --merge are mutually exclusive")
    if args.verify:
        verify_bank(
            args.verify,
            args.unique_time,
            args.workers,
            args.pool_size,
            args.seed,
            not args.skip_minimum_proof,
        )
        return
    if args.reclue:
        reclue_bank(
            args.reclue,
            args.output,
            args.unique_time,
            args.workers,
            args.pool_size,
            args.seed,
        )
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
        guard_limit=args.guard_limit,
        target_attempts=args.target_attempts,
        pool_size=args.pool_size,
    )
    puzzles = []
    for index, (difficulty_id, name, n, k) in enumerate(DIFFICULTIES):
        if difficulty_id not in selected_ids:
            continue
        for variant in range(args.variants):
            puzzle_seed = (
                args.seed
                + index * 0x9E3779B97F4A7C15
                + variant * 0xD1B54A32D192ED03
            )
            puzzles.append(
                generate_unique_puzzle(difficulty_id, name, n, k, puzzle_seed, settings)
            )

    document = {
        "schemaVersion": 4,
        "generator": "three_holes_unique_generator.py",
        "algorithm": (
            "certified-natural-blobs-with-irregular-targets-and-minimum-visible-exclusions"
        ),
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
