// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod types;
use std::env;
use std::fs;
use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use tauri::command;
use types::Task;
use types::TaskFolder;

fn get_data_dir() -> PathBuf {
    PathBuf::from(r"D:\ALIP\DesktopApp\SavedData")
}

//fn get_data_dir() -> PathBuf {
//  let base_dir = env::var("APPDATA").unwrap_or_else(|_| ".".to_string());
//  PathBuf::from(base_dir).join("desktop-app")
//}

fn get_tasks_file() -> PathBuf {
    get_data_dir().join("Tasks.json")
}

fn initialize_data_folder() -> Result<(), String> {
    let data_dir = get_data_dir();
    if !data_dir.exists() {
        fs::create_dir_all(data_dir).map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn initialize_tasks_json() -> Result<(), String> {
    let tasks_file_path = get_tasks_file();

    let mut tasks_file = OpenOptions::new()
        .create(true)
        .write(true)
        .open(&tasks_file_path)
        .map_err(|e| e.to_string())?;

    let metadata = tasks_file.metadata().map_err(|e| e.to_string())?;
    let len = metadata.len();
    if len == 0 {
        let t = Vec::<TaskFolder>::new();
        let json = serde_json::to_string_pretty(&t).map_err(|e| e.to_string())?;
        tasks_file
            .write_all(json.as_bytes())
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub fn setup() -> Result<(), String> {
    initialize_data_folder()?;
    initialize_tasks_json()?;
    Ok(())
}

fn find_task_array<'a>(
    folder_data: &'a mut Vec<TaskFolder>,
    folder_id: String,
) -> Result<&'a mut Vec<Task>, String> {
    if let Some(found) = folder_data.iter_mut().find(|folder| folder.id == folder_id) {
        Ok(&mut found.tasks)
    } else {
        return Err("Couldnt find folder with that id".into());
    }
}

fn find_task<'a>(task_array: &'a mut Vec<Task>, task_id: String) -> Result<&'a mut Task, String> {
    if let Some(found) = task_array.iter_mut().find(|task| task.id == task_id) {
        Ok(found)
    } else {
        Err("Couldnt find tasks with that id".to_string())
    }
}

fn write_to_task_json(folder_data: Vec<TaskFolder>) -> Result<(), String> {
    let file_path: PathBuf = get_tasks_file();
    let tasks_file = OpenOptions::new()
        .write(true)
        .truncate(true)
        .open(&file_path)
        .map_err(|e| e.to_string())?;
    serde_json::to_writer_pretty(&tasks_file, &folder_data).map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
fn fetch_task_data() -> Result<Vec<TaskFolder>, String> {
    let file_path: PathBuf = get_tasks_file();
    let tasks_file = OpenOptions::new()
        .read(true)
        .open(&file_path)
        .map_err(|e| e.to_string())?;
    let task_data: Vec<TaskFolder> =
        serde_json::from_reader(&tasks_file).map_err(|e| e.to_string())?;
    Ok(task_data)
}

#[command]
fn create_folder(
    folder_name: String,
    folder_id: String,
    folder_color: String,
    folder_width: i32,
    folder_height: i32,
    folder_pos_x: i32,
    folder_pos_y: i32,
    folder_zindex: i32,
) -> Result<(), String> {
    let folder = TaskFolder {
        name: folder_name,
        id: folder_id,
        colour: folder_color,
        visible: true,
        tasks: Vec::new(),
        width: folder_width,
        height: folder_height,
        x: folder_pos_x,
        y: folder_pos_y,
        zindex: folder_zindex,
    };
    let mut folder_data = fetch_task_data()?;
    folder_data.push(folder);
    write_to_task_json(folder_data)?;
    Ok(())
}

#[command]
fn create_task(t: Task, folder_id: String) -> Result<(), String> {
    let mut folder_data = fetch_task_data()?;
    let target_vec: &mut Vec<Task> = find_task_array(&mut folder_data, folder_id)?;
    target_vec.push(t);
    write_to_task_json(folder_data)?;
    Ok(())
}

#[command]
fn complete_task(task_id: String, folder_id: String) -> Result<(), String> {
    let mut folder_data = fetch_task_data()?;
    let target_vec: &mut Vec<Task> = find_task_array(&mut folder_data, folder_id)?;
    let target_task = find_task(target_vec, task_id)?;
    target_task.completed = !target_task.completed;
    write_to_task_json(folder_data)?;
    Ok(())
}

#[command]
fn delete_task(task_id: String, folder_id: String) -> Result<(), String> {
    let mut folder_data = fetch_task_data()?;
    let target_vec: &mut Vec<Task> = find_task_array(&mut folder_data, folder_id)?;
    target_vec.retain(|task| task.id != task_id);
    write_to_task_json(folder_data)?;
    Ok(())
}

#[command]
fn duplicate_task(task_id: String, clone_task_id: String, folder_id: String) -> Result<(), String> {
    let mut folder_data = fetch_task_data()?;
    let target_vec: &mut Vec<Task> = find_task_array(&mut folder_data, folder_id)?;
    if let Some(task_to_clone) = target_vec.iter_mut().find(|task| task.id == task_id) {
        let mut task = task_to_clone.clone();
        task.id = clone_task_id;
        target_vec.push(task);
    } else {
        return Err("Couldnt find task to clone".to_string());
    }
    write_to_task_json(folder_data)?;
    Ok(())
}

#[command]
fn duplicate_folder(
    folder_id: String,
    folder_clone_id: String,
    task_clone_ids: Vec<String>,
) -> Result<(), String> {
    let mut folder_data = fetch_task_data()?;
    if let Some(target_vec) = folder_data.iter_mut().find(|folder| folder.id == folder_id) {
        let mut clone_folder = target_vec.clone();
        if clone_folder.tasks.len() != task_clone_ids.len() {
            return Err(format!(
                "Expected {} task IDs, got {}",
                clone_folder.tasks.len(),
                task_clone_ids.len()
            ));
        }
        clone_folder.id = folder_clone_id;
        for (i, task) in clone_folder.tasks.iter_mut().enumerate() {
            task.id = task_clone_ids[i].clone();
        }
        folder_data.push(clone_folder);
    } else {
        return Err("Couldnt find folder to clone".to_string());
    }
    write_to_task_json(folder_data)?;
    Ok(())
}

#[command]
fn edit_task(
    task_id: String,
    folder_id: String,
    new_text: String,
    new_colour: String,
) -> Result<(), String> {
    let mut folder_data = fetch_task_data()?;
    let target_vec: &mut Vec<Task> = find_task_array(&mut folder_data, folder_id)?;
    let target_task = find_task(target_vec, task_id)?;
    target_task.text = new_text;
    target_task.colour = new_colour;
    write_to_task_json(folder_data)?;
    Ok(())
}

#[command]
fn edit_folder(folder_id: String, new_name: String, new_colour: String) -> Result<(), String> {
    let mut folder_data = fetch_task_data()?;
    if let Some(found) = folder_data.iter_mut().find(|folder| folder.id == folder_id) {
        found.name = new_name;
        found.colour = new_colour;
    } else {
        return Err("Couldnt find folder with that id while editing".into());
    }

    write_to_task_json(folder_data)?;
    Ok(())
}

#[command]
fn resize_folder(folder_id: String, new_width: i32, new_height: i32) -> Result<(), String> {
    let mut folder_data = fetch_task_data()?;
    if let Some(found) = folder_data.iter_mut().find(|folder| folder.id == folder_id) {
        found.width = new_width;
        found.height = new_height;
    } else {
        return Err("Couldnt find folder with that id while editing".into());
    }

    write_to_task_json(folder_data)?;
    Ok(())
}

#[command]
fn move_folder(folder_id: String, x: i32, y: i32) -> Result<(), String> {
    let mut folder_data = fetch_task_data()?;
    if let Some(found) = folder_data.iter_mut().find(|folder| folder.id == folder_id) {
        found.x = x;
        found.y = y;
    } else {
        return Err("Couldnt find folder with that id while editing".into());
    }

    write_to_task_json(folder_data)?;
    Ok(())
}

#[command]
fn move_task_order(task_id: String, folder_id: String, new_index: usize) -> Result<(), String> {
    let mut folder_data = fetch_task_data()?;
    let target_vec: &mut Vec<Task> = find_task_array(&mut folder_data, folder_id)?;
    if let Some(old_index) = target_vec.iter().position(|t| t.id == task_id) {
        let target_task = target_vec.remove(old_index);
        let final_index = new_index.min(target_vec.len());
        target_vec.insert(final_index, target_task);
        write_to_task_json(folder_data)?;
    } else {
        return Err("Couldnt move task".into());
    }
    Ok(())
}

#[command]
fn toggle_visability_folder(folder_id: String) -> Result<(), String> {
    let mut folder_data = fetch_task_data()?;
    if let Some(target_folder) = folder_data.iter_mut().find(|folder| folder.id == folder_id) {
        target_folder.visible = !target_folder.visible;
        write_to_task_json(folder_data)?;
    } else {
        return Err("Couldnt find target folder".to_string());
    }
    Ok(())
}

#[command]
fn change_folder_zindex(folder_id: String, new_zindex: i32) -> Result<(), String> {
    let mut folder_data = fetch_task_data()?;
    if let Some(target_folder) = folder_data.iter_mut().find(|folder| folder.id == folder_id) {
        target_folder.zindex = new_zindex;
        write_to_task_json(folder_data)?;
    } else {
        return Err("Couldnt find target folder".to_string());
    }
    Ok(())
}

#[command]
fn delete_tasks_folder(folder_id: String) -> Result<(), String> {
    let mut folder_data = fetch_task_data()?;
    folder_data.retain(|folder| folder.id != folder_id);
    write_to_task_json(folder_data)?;
    Ok(())
}

#[command]
fn move_task_to_folder(
    task_id: String,
    folder_id: String,
    new_folder_id: String,
) -> Result<(), String> {
    let mut folder_data = fetch_task_data()?;
    let target_vec = find_task_array(&mut folder_data, folder_id)?;

    let task_pos = target_vec
        .iter()
        .position(|task| task.id == task_id)
        .ok_or("Couldn't find task with that id")?;

    let target_task = target_vec.remove(task_pos);
    let new_target_vec = find_task_array(&mut folder_data, new_folder_id)?;
    new_target_vec.push(target_task);

    write_to_task_json(folder_data)?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            create_folder,
            fetch_task_data,
            create_task,
            complete_task,
            delete_task,
            move_task_to_folder,
            edit_task,
            toggle_visability_folder,
            delete_tasks_folder,
            duplicate_task,
            duplicate_folder,
            move_task_order,
            edit_folder,
            resize_folder,
            move_folder,
            change_folder_zindex
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
