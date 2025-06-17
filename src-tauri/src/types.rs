#![allow(dead_code)]
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct Task {
    pub text: String,
    pub completed: bool,
    pub id: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct TaskFolder {
    pub id: String,
    pub name: String,
    pub visible: bool,
    pub tasks: Vec<Task>,
}

#[derive(Serialize, Deserialize)]
pub struct TaskData {
    pub ungrouped: Vec<Task>,
    pub folders: Vec<TaskFolder>,
}
