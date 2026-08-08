import { KanbanBoard } from "../components/kanban/KanbanBoard";

export function BoardPage() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-slate-900">Pipeline board</h1>
        <p className="text-sm text-slate-500">Drag a card between columns to update its status.</p>
      </div>
      <KanbanBoard />
    </div>
  );
}
