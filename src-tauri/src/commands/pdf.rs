use std::fs;

#[tauri::command]
pub fn load_pdf(path: String) -> Result<Vec<u8>, String> {
    fs::read(path).map_err(|e| e.to_string())
}
