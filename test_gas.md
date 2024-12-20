    fn shuffle_line(blocks: u32, seed: felt252) -> u32 {
        let mut shift_rng: Dice = DiceTrait::new(5, seed);
        
        
        
        186734252


shift 1 -> test_controller_circular_shift_right 90378
shift 2 -> test_controller_circular_shift_right 101838
shift 3 -> test_controller_circular_shift_right 101838
shift 10 -> test_controller_circular_shift_right 119028
shift 11 -> test_controller_circular_shift_right 119028
shift 14 -> test_controller_circular_shift_right 119028
shift 20 -> test_controller_circular_shift_right 124758

SWIPE -> avec check coherence -> 9626568
SWIPE -> sans check coherence -> 3814520


test_actions_move_01 -> 195334524 avec shift_amount = 1 ET sans check de coherence
test_actions_move_01 -> 199882294 avec shift_amount = 1 ET avec check de coherence

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Test move 
// Avec cohérence
Transaction resource usage. usage="steps: 178136 | memory holes: 24988 | bitwise_builtin: 130 | ec_op_builtin: 6 | pedersen_builtin: 265 | poseidon_builtin: 92 | range_check_builtin: 30920 | segment_arena_builtin: 4"

// Sans cohérence
Transaction resource usage. usage="steps: 159326 | memory holes: 20939 | bitwise_builtin: 122 | ec_op_builtin: 6 | pedersen_builtin: 265 | poseidon_builtin: 92 | range_check_builtin: 26658 | segment_arena_builtin: 4"

Summary of decreases:
Steps: -11.8%
Memory holes: -19.3%
Bitwise builtin: -6.6%
Range check builtin: -16.0%
EC op, Pedersen, Poseidon, and Segment arena: 0% (no change)

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Test remove handle_score_tournament

// Avec handle_score_tournament avec un score en plus
Transaction resource usage. usage="steps: 208211 | memory holes: 27438 | bitwise_builtin: 166 | ec_op_builtin: 6 | pedersen_builtin: 271 | poseidon_builtin: 130 | range_check_builtin: 34549 | segment_arena_builtin: 4"


// Sans handle_score_tournament avec un score en plus
Transaction resource usage. usage="steps: 210519 | memory holes: 29855 | bitwise_builtin: 132 | ec_op_builtin: 6 | pedersen_builtin: 268 | poseidon_builtin: 116 | range_check_builtin: 37361 | segment_arena_builtin: 4"



Sepolia
Tx daily pas de ligne cassée
https://sepolia.voyager.online/tx/0x5c8597fda98a891f55c28231d2378ca77523b25b8c10eba8e90b1dc9b70ea67 -> 0.476786489898206178 STRK 
206352 STEPS, 156 PEDERSEN_BUILTIN, 31918 RANGE_CHECK_BUILTIN, 130 BITWISE_BUILTIN, 6 EC_OP_BUILTIN, 113 POSEIDON_BUILTIN
https://sepolia.voyager.online/tx/0x3a230843efce5b512e4bf76b17a72ec4e6ac4f0d8a0fe44bdbf6664c9f246ac -> 0.60861224973084059 STRK
246395 STEPS, 156 PEDERSEN_BUILTIN, 39516 RANGE_CHECK_BUILTIN, 145 BITWISE_BUILTIN, 6 EC_OP_BUILTIN, 113 POSEIDON_BUILTIN

Tx daily ligne cassée
https://sepolia.voyager.online/tx/0x3b283772a5323f67bfe2cfe6b3524cec53707b1017f4786537980bd4b3c42f1 -> 0.65224293637516218 STRK
278830 STEPS, 162 PEDERSEN_BUILTIN, 43239 RANGE_CHECK_BUILTIN, 193 BITWISE_BUILTIN, 6 EC_OP_BUILTIN, 133 POSEIDON_BUILTIN
https://sepolia.voyager.online/tx/0x1accb5378dac0ec1126a0ea995a4e6e32f952de5b2056bfc0b71cb73b1ae981 -> 0.672917519751751936 STRK
283641 STEPS, 162 PEDERSEN_BUILTIN, 44142 RANGE_CHECK_BUILTIN, 204 BITWISE_BUILTIN, 6 EC_OP_BUILTIN, 133 POSEIDON_BUILTIN


// Update freetoplay better
// ligne cassée
https://sepolia.voyager.online/tx/0x74a5d5339df4f731e8430fbfd9d012259a2803bce39b1ecccf2126477bf47a0
https://sepolia.voyager.online/tx/0x3f70adc4f6c4bd5c668ca826a9a515b94b4e92e5b99acba88d223e824249f2f
https://sepolia.voyager.online/tx/0x5227aa3b7ab8d4a45694a20b80444fb5e9414727292f0745cae71bfb89a6b8a
https://sepolia.voyager.online/tx/0x3d7b2d294e670a4c82179d48190899e880b697930ddc8ed8e407b791c31f5bc
0x74a5d5339df4f731e8430fbfd9d012259a2803bce39b1ecccf2126477bf47a0 -> 0.4219964666101333 STRK 182511 STEPS, 159 PEDERSEN_BUILTIN, 27274 RANGE_CHECK_BUILTIN, 143 BITWISE_BUILTIN, 6 EC_OP_BUILTIN, 117 POSEIDON_BUILTIN
0x3f70adc4f6c4bd5c668ca826a9a515b94b4e92e5b99acba88d223e824249f2f -> 0.49624359662976114 STRK 205134 STEPS, 159 PEDERSEN_BUILTIN, 32153 RANGE_CHECK_BUILTIN, 128 BITWISE_BUILTIN, 6 EC_OP_BUILTIN, 97 POSEIDON_BUILTIN
0x5227aa3b7ab8d4a45694a20b80444fb5e9414727292f0745cae71bfb89a6b8a -> 0.4515437938628423 STRK 192217 STEPS, 159 PEDERSEN_BUILTIN, 29212 RANGE_CHECK_BUILTIN, 128 BITWISE_BUILTIN, 6 EC_OP_BUILTIN, 117 POSEIDON_BUILTIN

// ligne non cassé
https://sepolia.voyager.online/tx/0x4450436dc7d2e8a1d4d600a1506a955a7170a18fd75edfcf9852d0d7e8c0740
https://sepolia.voyager.online/tx/0x2917c8b086fbb49fe25d81c9bf0401d68159cec5726f98ea60d1c1f8a5cd34e
https://sepolia.voyager.online/tx/0x1ada9470f0862e72c3261dcb2ad7534706e8350cbe5b213d63dad85ffd37b56
https://sepolia.voyager.online/tx/0x1127d6aeaf19f1277fd783f7738b10931fe2f862f3cdfb70b7e1312a91a7bb9
0x4450436dc7d2e8a1d4d600a1506a955a7170a18fd75edfcf9852d0d7e8c0740 -> 0.4238905260494095 STRK 179566 STEPS, 156 PEDERSEN_BUILTIN, 27429 RANGE_CHECK_BUILTIN, 140 BITWISE_BUILTIN, 6 EC_OP_BUILTIN, 97 POSEIDON_BUILTIN
0x2917c8b086fbb49fe25d81c9bf0401d68159cec5726f98ea60d1c1f8a5cd34e -> 0.44661923932072417 STRK 188397 STEPS, 156 PEDERSEN_BUILTIN, 28927 RANGE_CHECK_BUILTIN, 119 BITWISE_BUILTIN, 6 EC_OP_BUILTIN, 113 POSEIDON_BUILTIN


// daily
// non cassée
https://sepolia.voyager.online/tx/0x7a261302ddd0d8a1a02580e7ac4e6f4d9270cd12a0fe4b55fd1ac45afe361f7
https://sepolia.voyager.online/tx/0x5d0a2aa6d9fc9f82930807ec4ed908ad0c17502e34e7b1c486f2954811fdc89
https://sepolia.voyager.online/tx/0x75a94b86b78db70b2f26b034f12fc5c40aadeacc2863f8ad63561e31e35fc4a
https://sepolia.voyager.online/tx/0x5d23b9728a8850b695a9aa127566fb04ea6bd553d32b99cef303981f0b4c69a
https://sepolia.voyager.online/tx/0x414d5ffce8fa525b3d66426b6519d268b548327e1482e13c1d3a46f14a6461d
0x7a261302ddd0d8a1a02580e7ac4e6f4d9270cd12a0fe4b55fd1ac45afe361f7 -> 0.3887340263164098 STRK 176995 STEPS, 156 PEDERSEN_BUILTIN, 26571 RANGE_CHECK_BUILTIN, 122 BITWISE_BUILTIN, 6 EC_OP_BUILTIN, 93 POSEIDON_BUILTIN
0x5d0a2aa6d9fc9f82930807ec4ed908ad0c17502e34e7b1c486f2954811fdc89 -> 0.4457531271867301 STRK 199629 STEPS, 156 PEDERSEN_BUILTIN, 30550 RANGE_CHECK_BUILTIN, 137 BITWISE_BUILTIN, 6 EC_OP_BUILTIN, 113 POSEIDON_BUILTIN
0x75a94b86b78db70b2f26b034f12fc5c40aadeacc2863f8ad63561e31e35fc4a -> 0.4773551794923131 STRK 211711 STEPS, 156 PEDERSEN_BUILTIN, 32753 RANGE_CHECK_BUILTIN, 135 BITWISE_BUILTIN, 6 EC_OP_BUILTIN, 113 POSEIDON_BUILTIN
0x5d23b9728a8850b695a9aa127566fb04ea6bd553d32b99cef303981f0b4c69a -> 0.5185682741792529 STRK 226984 STEPS, 156 PEDERSEN_BUILTIN, 35646 RANGE_CHECK_BUILTIN, 123 BITWISE_BUILTIN, 6 EC_OP_BUILTIN, 113 POSEIDON_BUILTIN
0x414d5ffce8fa525b3d66426b6519d268b548327e1482e13c1d3a46f14a6461d -> 0.5820006025234993 STRK 250179 STEPS, 156 PEDERSEN_BUILTIN, 40063 RANGE_CHECK_BUILTIN, 138 BITWISE_BUILTIN, 6 EC_OP_BUILTIN, 113 POSEIDON_BUILTIN

// cassée
https://sepolia.voyager.online/tx/0xb576bd4ba17e79a5b83b1a3bdcdac922e2804282bbfbc00cbb236da0935fc5
https://sepolia.voyager.online/tx/0x115b73e3aafd05fd77115acae80112bce0352b1c55ce8b8b889978a334937
https://sepolia.voyager.online/tx/0x3de76c682b574dd35f0d63753628d64dc2debe8b8fd53ac7b923a30b6b2ee24
0xb576bd4ba17e79a5b83b1a3bdcdac922e2804282bbfbc00cbb236da0935fc5 -> 0.4970344645117382 STRK 230356 STEPS, 162 PEDERSEN_BUILTIN, 33986 RANGE_CHECK_BUILTIN, 166 BITWISE_BUILTIN, 6 EC_OP_BUILTIN, 133 POSEIDON_BUILTIN
0x115b73e3aafd05fd77115acae80112bce0352b1c55ce8b8b889978a334937 -> 0.5153429092007363 STRK 237585 STEPS, 162 PEDERSEN_BUILTIN, 35293 RANGE_CHECK_BUILTIN, 167 BITWISE_BUILTIN, 6 EC_OP_BUILTIN, 133 POSEIDON_BUILTIN
0x3de76c682b574dd35f0d63753628d64dc2debe8b8fd53ac7b923a30b6b2ee24 -> 0.6880795321494751 STRK 300632 STEPS, 162 PEDERSEN_BUILTIN, 47340 RANGE_CHECK_BUILTIN, 164 BITWISE_BUILTIN, 6 EC_OP_BUILTIN, 127 POSEIDON_BUILTIN
