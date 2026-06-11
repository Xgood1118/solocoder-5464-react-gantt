export const detectCycle = (tasks, links) => {
  const adjacency = new Map()
  const inDegree = new Map()

  tasks.forEach((t) => {
    adjacency.set(t.id, [])
    inDegree.set(t.id, 0)
  })

  links.forEach((link) => {
    if (adjacency.has(link.source) && adjacency.has(link.target)) {
      adjacency.get(link.source).push(link.target)
      inDegree.set(link.target, (inDegree.get(link.target) || 0) + 1)
    }
  })

  const queue = []
  inDegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id)
  })

  let visited = 0
  while (queue.length > 0) {
    const node = queue.shift()
    visited++
    const neighbors = adjacency.get(node) || []
    neighbors.forEach((n) => {
      inDegree.set(n, inDegree.get(n) - 1)
      if (inDegree.get(n) === 0) queue.push(n)
    })
  }

  const hasCycle = visited !== tasks.length
  return { hasCycle, visitedCount: visited, totalCount: tasks.length }
}

export const topologicalSort = (tasks, links) => {
  const adjacency = new Map()
  const inDegree = new Map()
  const taskMap = new Map(tasks.map((t) => [t.id, t]))

  tasks.forEach((t) => {
    adjacency.set(t.id, [])
    inDegree.set(t.id, 0)
  })

  links.forEach((link) => {
    if (adjacency.has(link.source) && adjacency.has(link.target)) {
      adjacency.get(link.source).push({ target: link.target, type: link.type })
      inDegree.set(link.target, (inDegree.get(link.target) || 0) + 1)
    }
  })

  const queue = []
  inDegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id)
  })

  const result = []
  while (queue.length > 0) {
    const node = queue.shift()
    result.push(taskMap.get(node))
    const neighbors = adjacency.get(node) || []
    neighbors.forEach(({ target }) => {
      inDegree.set(target, inDegree.get(target) - 1)
      if (inDegree.get(target) === 0) queue.push(target)
    })
  }

  return result
}
