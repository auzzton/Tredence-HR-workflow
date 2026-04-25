# Implemented in Step 7.
# Pure utility — no FastAPI, no SQLAlchemy.
# Will provide:
#   - validate_graph(nodes, edges) -> list[str]
#     Checks: missing Start node, cycles (three-color DFS), orphan nodes
