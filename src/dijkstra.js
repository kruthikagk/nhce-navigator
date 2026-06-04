import { PATH_NODES } from "./pathNodes";
import { GRAPH } from "./graph";

function getDistance(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
}

export function dijkstra(start, end) {
  const distances = {};
  const previous = {};
  const unvisited = new Set();

  PATH_NODES.forEach((_, index) => {
    distances[index] = Infinity;
    previous[index] = null;
    unvisited.add(index);
  });

  distances[start] = 0;

  while (unvisited.size > 0) {
    let current = null;

    unvisited.forEach((node) => {
      if (
        current === null ||
        distances[node] < distances[current]
      ) {
        current = node;
      }
    });

    if (current === end) break;

    unvisited.delete(current);

    const neighbors = GRAPH[current] || [];

    neighbors.forEach((neighbor) => {
      const alt =
        distances[current] +
        getDistance(
          PATH_NODES[current],
          PATH_NODES[neighbor]
        );

      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        previous[neighbor] = current;
      }
    });
  }

  const path = [];

  let current = end;

  while (current !== null) {
    path.unshift(current);
    current = previous[current];
  }

  return path;
}