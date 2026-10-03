//! Python PyO3 bindings for Chanakya Sovereign Optimization Solver

#[no_mangle]
pub extern "C" fn chanakya_version() -> *const std::os::raw::c_char {
    "1.0.0\0".as_ptr() as *const std::os::raw::c_char
}
