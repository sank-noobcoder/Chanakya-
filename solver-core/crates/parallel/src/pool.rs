//! Deterministic Parallel Execution Coordinator

use rayon::ThreadPoolBuilder;

pub struct ParallelCoordinator {
    pub threads: usize,
    pub deterministic: bool,
}

impl ParallelCoordinator {
    pub fn new(threads: usize, deterministic: bool) -> Self {
        Self { threads, deterministic }
    }

    pub fn init_global_pool(&self) {
        let _ = ThreadPoolBuilder::new()
            .num_threads(self.threads)
            .build_global();
    }
}
