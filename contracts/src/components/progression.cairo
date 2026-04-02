#[starknet::component]
pub mod ProgressionComponent {
    #[storage]
    pub struct Storage {}

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {}
}
