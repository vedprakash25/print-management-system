use std::ptr;
use winapi::shared::minwindef::{DWORD, LPBYTE};
use winapi::um::winspool::{EnumPrintersW, PRINTER_ENUM_LOCAL, PRINTER_INFO_4W};

pub fn get_printers() -> Vec<String> {
    unsafe {
        let mut needed: DWORD = 0;
        let mut returned: DWORD = 0;

        // First call: get required buffer size
        EnumPrintersW(
            PRINTER_ENUM_LOCAL,
            ptr::null_mut(),
            4,
            ptr::null_mut(),
            0,
            &mut needed,
            &mut returned,
        );

        if needed == 0 {
            return vec![];
        }

        let mut buffer: Vec<u8> = vec![0; needed as usize];

        // Second call: get printers
        let success = EnumPrintersW(
            PRINTER_ENUM_LOCAL,
            ptr::null_mut(),
            4,
            buffer.as_mut_ptr() as LPBYTE,
            needed,
            &mut needed,
            &mut returned,
        );

        if success == 0 {
            return vec![];
        }

        let printers = std::slice::from_raw_parts(
            buffer.as_ptr() as *const PRINTER_INFO_4W,
            returned as usize,
        );

        printers
            .iter()
            .filter_map(|p| wide_ptr_to_string(p.pPrinterName))
            .collect()
    }
}

fn wide_ptr_to_string(ptr: *const u16) -> Option<String> {
    if ptr.is_null() {
        return None;
    }

    unsafe {
        let mut len = 0;
        while *ptr.add(len) != 0 {
            len += 1;
        }

        let slice = std::slice::from_raw_parts(ptr, len);
        Some(String::from_utf16_lossy(slice))
    }
}
