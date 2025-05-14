use alexandria_encoding::base64::Base64Encoder;
use core::{array::{ArrayTrait, SpanTrait}, clone::Clone, traits::Into};
use zkube::helpers::encoding::{U256BytesUsedTraitImpl, bytes_base64_encode};
use graffiti::json::JsonImpl;

fn create_text(
    text: ByteArray,
    x: ByteArray,
    y: ByteArray,
    fontsize: ByteArray,
    baseline: ByteArray,
    text_anchor: ByteArray,
) -> ByteArray {
    "<text x='"
        + x
        + "' y='"
        + y
        + "' font-size='"
        + fontsize
        + "' text-anchor='"
        + text_anchor
        + "' dominant-baseline='"
        + baseline
        + "'>"
        + text
        + "</text>"
}

fn game_state(over: bool) -> ByteArray {
    if over {
        "Game Over"
    } else {
        "In Progress"
    }
}

fn combine_elements(ref elements: Span<ByteArray>) -> ByteArray {
    let mut count: u8 = 1;

    let mut combined: ByteArray = "";
    loop {
        match elements.pop_front() {
            Option::Some(element) => {
                combined += element.clone();

                count += 1;
            },
            Option::None(()) => { break; },
        }
    };

    combined
}

fn create_rect() -> ByteArray {
    "<rect x='0.5' y='0.5' width='469' height='599' rx='27.5' fill='black' stroke='#6bd1f2'/>"
}

// @notice Generates an SVG string for game token uri
// @param internals The internals of the SVG
// @return The generated SVG string
fn create_svg(internals: ByteArray) -> ByteArray {
    "<svg xmlns='http://www.w3.org/2000/svg' width='470' height='600'><style>text{text-transform: uppercase;font-family: Courier, monospace;fill: #6bd1f2;}g{fill: #6bd1f2;}</style>"
        + internals
        + "</svg>"
}

pub fn create_metadata(
    token_id: u64,
    player_name: felt252,
    over: bool,
    score: u16,
    moves: u16,
    combo: u16,
    max_combo: u8,
    hammer_bonus: u8,
    wave_bonus: u8,
    totem_bonus: u8,
) -> ByteArray {
    //let rect = create_rect();
    //let logo_element = logo();
    let mut _name = Default::default();

    if player_name != 0 {
        _name
            .append_word(
                player_name, U256BytesUsedTraitImpl::bytes_used(player_name.into()).into()
            );
    }

    let _game_id = format!("{}", token_id);
    let _status = game_state(over);
    let _score = format!("{}", score);
    let _combo = format!("{}", combo);
    let _max_combo = format!("{}", max_combo);
    let _hammer_bonus = format!("{}", hammer_bonus);
    let _wave_bonus = format!("{}", wave_bonus);
    let _totem_bonus = format!("{}", totem_bonus);

    // Combine all elements
    let mut elements = array![
        create_text("zKube #" + _game_id.clone(), "30", "40", "24", "middle", "left"),
    ];

    elements.append(create_text(_name.clone(), "30", "80", "20", "middle", "left"));

    if score != 0 {
        elements.append(create_text(game_state(over).clone(), "300", "40", "20", "middle", "left"));
        elements
            .append(create_text("Score: " + _score.clone(), "30", "125", "18", "middle", "left"));
        elements
            .append(create_text("Combo: " + _combo.clone(), "30", "150", "18", "middle", "left"));
        elements
            .append(
                create_text("Max Combo: " + _max_combo.clone(), "30", "175", "18", "middle", "left")
            );
        elements
            .append(
                create_text(
                    "Hammer Bonus: " + _hammer_bonus.clone(), "30", "225", "18", "middle", "left"
                )
            );
        elements
            .append(
                create_text(
                    "Wave Bonus: " + _wave_bonus.clone(), "30", "250", "18", "middle", "left"
                )
            );
        elements
            .append(
                create_text(
                    "Totem Bonus: " + _totem_bonus.clone(), "30", "275", "18", "middle", "left"
                )
            );
    } else {
        elements.append(create_text("Game not started", "280", "40", "20", "middle", "left"));
    }

    let mut elements = elements.span();
    let image = create_svg(combine_elements(ref elements));

    let base64_image = format!("data:image/svg+xml;base64,{}", bytes_base64_encode(image));

    let mut metadata = JsonImpl::new()
        .add("name", "Game" + " #" + _game_id)
        .add("description", "An NFT representing ownership of a game of zKube.")
        .add("image", base64_image);

    let name_str: ByteArray = JsonImpl::new().add("trait", "Name").add("value", _name).build();
    let status_str: ByteArray = JsonImpl::new()
        .add("trait", "Status")
        .add("value", _status)
        .build();
    let score_str: ByteArray = JsonImpl::new().add("trait", "Score").add("value", _score).build();
    let combo_str: ByteArray = JsonImpl::new().add("trait", "Combo").add("value", _combo).build();
    let max_combo_str: ByteArray = JsonImpl::new()
        .add("trait", "Max Combo")
        .add("value", _max_combo)
        .build();
    let attributes = array![name_str, status_str, score_str, combo_str, max_combo_str,].span();

    let metadata = metadata.add_array("attributes", attributes).build();

    format!("data:application/json;base64,{}", bytes_base64_encode(metadata))
}
