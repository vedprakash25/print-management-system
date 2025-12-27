use crate::services::print_service;

#[tauri::command]
pub fn list_printers() -> Vec<String> {
    print_service::get_printers()
}
