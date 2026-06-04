import { PATH_NODES } from "./pathNodes";

export function findNearestNode(point) {
  let nearestIndex = 0;
  let nearestDistance = Infinity;

  PATH_NODES.forEach((node, index) => {
    const dx = node[0] - point[0];
    const dy = node[1] - point[1];

    const distance = dx * dx + dy * dy;

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  return nearestIndex;
}