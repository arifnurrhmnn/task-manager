"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createTask, deleteTask, fetchTasks, updateTask } from "./lib/api";

type Task = {
  id: number;
  title: string;
  completed: boolean;
};

export default function Home() {
  const queryClient = useQueryClient();
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const {
    data: tasks,
    isLoading,
    error,
  } = useQuery<Task[], Error>({
    queryKey: ["tasks"],
    queryFn: () => fetchTasks(),
  });

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: (newTask) => {
      queryClient.setQueryData(["tasks"], (old: Task[] | undefined) => [
        ...(old || []),
        newTask,
      ]);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (err) => console.log("Create error: ", err),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, task }: { id: number; task: Partial<Task> }) =>
      updateTask(id, task),
    onSuccess: (updatedTask) => {
      queryClient.setQueryData(["tasks"], (old: Task[] | undefined) => {
        old?.map((task) => (task.id === updatedTask.id ? updateTask : task));
      });
      queryClient.invalidateQueries({
        queryKey: ["tasks"],
      });
    },
    onError: (err) => console.log("Update error: ", err),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: (id) => {
      queryClient.setQueryData(["tasks"], (old: Task[] | undefined) => {
        old?.filter((task) => task.id !== id);
      });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (err) => console.log("Delete error: ", err),
  });

  const handleAddTask = () => {
    if (newTaskTitle) {
      createTaskMutation.mutate({
        title: newTaskTitle,
        completed: false,
      });
      setNewTaskTitle("");
    }
  };

  const handleToggleComplete = (task: Task) => {
    updateTaskMutation.mutate({
      id: task.id,
      task: {
        completed: !task.completed,
      },
    });
  };

  const handleDeleteTask = (id: number) => {
    deleteTaskMutation.mutate(id);
  };

  if (isLoading) return <p>Loading tasks...</p>;
  if (error) return <p>Error: {(error as Error).message}</p>;

  return (
    <div className="w-full min-h-screen pt-8">
      <div className="container m-auto flex gap-2">
        <Input
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e?.target?.value)}
          placeholder="Masukkan judul tugas"
        />
        <Button onClick={handleAddTask} disabled={createTaskMutation.isPending}>
          {createTaskMutation.isPending ? "Adding..." : "Tambah Tugas"}
        </Button>
      </div>

      <ul className="container py-8 m-auto gap-4">
        {tasks?.slice(0, 10).map((task) => (
          <li
            className="flex items-center bg-secondary  px-3 py-2 rounded-md"
            key={task.id}
            style={{ marginBottom: "10px" }}
          >
            <Checkbox
              className="border-2 border-foreground"
              checked={task.completed}
              onChange={() => handleToggleComplete(task)}
              disabled={updateTaskMutation.isPending}
            />
            <span
              style={{
                textDecoration: task.completed ? "line-through" : "none",
                marginLeft: "10px",
              }}
            >
              {task.title}
            </span>
            <Button
              variant={"destructive"}
              className="ml-auto"
              onClick={() => handleDeleteTask(task.id)}
              disabled={deleteTaskMutation.isPending}
            >
              {deleteTaskMutation.isPending &&
              deleteTaskMutation.variables === task.id
                ? "Deleting..."
                : "Hapus"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
