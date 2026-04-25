# Implemented in Step 5.
# Will provide:
#   - WorkflowService with async methods:
#     list_workflows(db, limit, offset) -> tuple[list[Workflow], int]
#     get_workflow(db, id)              -> Workflow
#     create_workflow(db, data)         -> Workflow
#     update_workflow(db, id, data)     -> Workflow
#     delete_workflow(db, id)           -> None
