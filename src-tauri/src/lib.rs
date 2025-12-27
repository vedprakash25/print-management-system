mod commands;
mod services;

use commands::pdf::load_pdf;
use commands::printer::list_printers;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // ─── Plugins (keep these exactly) ─────────────────────────────
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        // ─── Commands (IPC) ───────────────────────────────────────────
        .invoke_handler(tauri::generate_handler![list_printers, load_pdf,])
        // ─── Run App ─────────────────────────────────────────────────
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
