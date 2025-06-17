// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use desktop_app_lib::setup;

fn main() {
    if let Err(e) = setup() {
        eprintln!("Startup failed: {}", e);
        return;
    }

    desktop_app_lib::run()
}
