#![allow(dead_code)]
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct Task {
    pub text: String,
    pub colour: String,
    pub completed: bool,
    pub id: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct TaskFolder {
    pub id: String,
    pub name: String,
    pub colour: String,
    pub visible: bool,
    pub tasks: Vec<Task>,
    pub width: i32,
    pub height: i32,
    pub x: i32,
    pub y: i32,
    pub zindex: i32,
}
#[derive(Serialize, Deserialize, Clone)]
pub struct EmailAccount {
    pub email: String,
    pub app_password: String,
    pub label: Option<String>,
}
