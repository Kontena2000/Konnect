
import { useState } from "react";
import { Todo, TodoStatus, TodoPriority } from "@/services/todo";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Calendar, Circle, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface TodoListProps {
  todos: Todo[];
  onCreateTodo: (todo: Partial<Todo>) => void;
  onUpdateTodo: (id: string, updates: Partial<Todo>) => void;
  onDeleteTodo: (id: string) => void;
}

export function TodoList({ todos, onCreateTodo, onUpdateTodo, onDeleteTodo }: TodoListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTodo, setNewTodo] = useState({
    title: "",
    description: "",
    status: "pending" as TodoStatus,
    priority: "medium" as TodoPriority
  });

  const getStatusIcon = (status: TodoStatus) => {
    switch (status) {
      case "pending": return <Circle className="h-4 w-4 text-yellow-500" />;
      case "in_progress": return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case "completed": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "blocked": return <XCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const handleCreateTodo = () => {
    onCreateTodo(newTodo);
    setNewTodo({
      title: "",
      description: "",
      status: "pending",
      priority: "medium"
    });
    setIsCreating(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tasks</CardTitle>
        <Button onClick={() => setIsCreating(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isCreating && (
            <div className="space-y-4 p-4 border rounded-lg">
              <Input
                placeholder="Task title"
                value={newTodo.title}
                onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
              />
              <Textarea
                placeholder="Description"
                value={newTodo.description}
                onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
              />
              <div className="flex gap-2">
                <Select
                  value={newTodo.priority}
                  onValueChange={(value: TodoPriority) => 
                    setNewTodo({ ...newTodo, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleCreateTodo}>Create</Button>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {todos.map((todo) => (
            <div
              key={todo.id}
              className="p-4 border rounded-lg space-y-2 hover:bg-accent/5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(todo.status)}
                  <span className="font-medium">{todo.title}</span>
                </div>
                <Select
                  value={todo.status}
                  onValueChange={(value: TodoStatus) => 
                    onUpdateTodo(todo.id, { status: value })
                  }
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {todo.description && (
                <p className="text-sm text-muted-foreground">{todo.description}</p>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="capitalize">Priority: {todo.priority}</span>
                {todo.dueDate && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(todo.dueDate).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
