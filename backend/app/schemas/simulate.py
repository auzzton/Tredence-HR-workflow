# Implemented in Step 4.
# Will provide:
#   - SimulateRequest    — graph_data: { nodes, edges }
#   - ExecutionLogEntry  — step, node_id, node_type, status, message, timestamp
#   - ValidationError    — code, message
#   - SimulateResponse   — log: list[ExecutionLogEntry], errors: list[ValidationError]
