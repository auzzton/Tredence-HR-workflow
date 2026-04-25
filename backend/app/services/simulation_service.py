# Implemented in Step 8.
# Will provide:
#   - SimulationService.run(graph_data) -> SimulateResponse
#     1. Validate graph (missing start, cycles, orphans)
#     2. DFS traversal from Start node
#     3. Emit one ExecutionLogEntry per visited node
