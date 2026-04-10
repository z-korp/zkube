use alexandria_encoding::base64::Base64Encoder;
use core::array::{ArrayTrait, SpanTrait};
use core::clone::Clone;
use core::traits::Into;
use graffiti::json::JsonImpl;
use zkube::helpers::encoding::{U256BytesUsedTraitImpl, bytes_base64_encode};

// ------------------------------------------ //
// ------------ Zone Color Helpers ----------- //
// ------------------------------------------ //

/// Returns (background, accent, secondary) colors for a zone.
pub fn get_zone_colors(zone_id: u8) -> (ByteArray, ByteArray, ByteArray) {
    if zone_id == 1 {
        ("#041A44", "#A9D8FF", "#2ECFB0")
    } else if zone_id == 2 {
        ("#120C08", "#D4AF37", "#F0CF7A")
    } else if zone_id == 3 {
        ("#0A1520", "#7EB8DA", "#A9C4DF")
    } else if zone_id == 4 {
        ("#1A2030", "#3B6FA0", "#BFD5E8")
    } else if zone_id == 5 {
        ("#0A1A0A", "#50C878", "#9CD8B6")
    } else if zone_id == 6 {
        ("#0A0F2A", "#1E90FF", "#9EB7DF")
    } else if zone_id == 7 {
        ("#0D0D12", "#C41E3A", "#E19AA3")
    } else if zone_id == 8 {
        ("#0A1A0A", "#4CAF50", "#A9BE72")
    } else if zone_id == 9 {
        ("#2A1F14", "#40C8B8", "#E0A07A")
    } else if zone_id == 10 {
        ("#1A1A2A", "#D4AF37", "#C7BCA9")
    } else {
        ("#000000", "#6bd1f2", "#6bd1f2")
    }
}

/// Returns zone name string.
pub fn get_zone_name(zone_id: u8) -> ByteArray {
    if zone_id == 1 {
        "Polynesian"
    } else if zone_id == 2 {
        "Egypt"
    } else if zone_id == 3 {
        "Norse"
    } else if zone_id == 4 {
        "Greece"
    } else if zone_id == 5 {
        "China"
    } else if zone_id == 6 {
        "Persia"
    } else if zone_id == 7 {
        "Japan"
    } else if zone_id == 8 {
        "Mayan"
    } else if zone_id == 9 {
        "Tribal"
    } else if zone_id == 10 {
        "Inca"
    } else {
        "Unknown"
    }
}

/// Maps difficulty u8 to human-readable name.
pub fn get_difficulty_name(difficulty: u8) -> ByteArray {
    if difficulty == 0 {
        "None"
    } else if difficulty == 2 {
        "Very Easy"
    } else if difficulty == 3 {
        "Easy"
    } else if difficulty == 4 {
        "Medium"
    } else if difficulty == 5 {
        "Medium Hard"
    } else if difficulty == 6 {
        "Hard"
    } else if difficulty == 7 {
        "Very Hard"
    } else if difficulty == 8 {
        "Expert"
    } else if difficulty == 9 {
        "Master"
    } else {
        "None"
    }
}

/// Maps run_type u8 to mode name.
pub fn get_mode_name(run_type: u8) -> ByteArray {
    if run_type == 0 {
        "ZONE"
    } else {
        "ENDLESS"
    }
}

// ------------------------------------------ //
// ------------ SVG Building Blocks --------- //
// ------------------------------------------ //

pub fn create_text(
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

pub fn game_state(over: bool) -> ByteArray {
    if over {
        "Game Over"
    } else {
        "In Progress"
    }
}

pub fn combine_elements(ref elements: Span<ByteArray>) -> ByteArray {
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
    }

    combined
}

/// Rounded rect with zone-themed border and background.
pub fn create_rect(bg_color: ByteArray, accent_color: ByteArray) -> ByteArray {
    "<rect x='0.5' y='0.5' width='469' height='599' rx='27.5' fill='"
        + bg_color
        + "' stroke='"
        + accent_color
        + "'/>"
}

/// Horizontal separator line.
pub fn create_line(y: ByteArray, accent_color: ByteArray) -> ByteArray {
    "<line x1='30' y1='"
        + y.clone()
        + "' x2='440' y2='"
        + y
        + "' stroke='"
        + accent_color
        + "' stroke-opacity='0.4' stroke-width='1'/>"
}

/// SVG wrapper with parameterized text color in the style block.
pub fn create_svg(internals: ByteArray, accent_color: ByteArray) -> ByteArray {
    "<svg xmlns='http://www.w3.org/2000/svg' width='470' height='600'><style>text{text-transform: uppercase;font-family: Courier, monospace;fill: "
        + accent_color.clone()
        + ";}g{fill: "
        + accent_color
        + ";}</style>"
        + internals
        + "</svg>"
}

// ------------------------------------------ //
// ------------ Metadata Builder ------------ //
// ------------------------------------------ //

pub fn create_metadata(
    token_id: felt252,
    player_name: felt252,
    over: bool,
    score: u32,
    level: u8,
    max_combo: u8,
    zone_id: u8,
    difficulty: u8,
    run_type: u8,
) -> ByteArray {
    let (bg_color, accent_color, secondary_color) = get_zone_colors(zone_id);
    let zone_name = get_zone_name(zone_id);
    let difficulty_name = get_difficulty_name(difficulty);
    let mode_name = get_mode_name(run_type);

    let rect = create_rect(bg_color, accent_color.clone());

    let mut _name: ByteArray = Default::default();
    if player_name != 0 {
        _name
            .append_word(
                player_name, U256BytesUsedTraitImpl::bytes_used(player_name.into()).into(),
            );
    }

    let _game_id = format!("{}", token_id);
    let _status = game_state(over);
    let _score = format!("{}", score);
    let _level = format!("{}", level);
    let _max_combo = format!("{}", max_combo);

    // Build SVG elements
    let mut elements = array![
        rect, // Title row: "zKube #ID" left, status right
        create_text("zKube #" + _game_id.clone(), "30", "40", "24", "middle", "start"),
        create_text(_status.clone(), "440", "40", "16", "middle", "end"),
        // Player name
        create_text(_name.clone(), "30", "72", "20", "middle", "start"),
        // First separator line
        create_line("100", accent_color.clone()),
        // Zone name left, mode right
        create_text(zone_name.clone(), "30", "135", "18", "middle", "start"),
        create_text(mode_name.clone(), "440", "135", "18", "middle", "end"),
    ];

    // Score section (centered)
    elements
        .append(
            "<text x='235' y='195' font-size='14' text-anchor='middle' dominant-baseline='middle' fill='"
                + secondary_color.clone()
                + "'>SCORE</text>",
        );
    elements.append(create_text(_score.clone(), "235", "240", "36", "middle", "middle"));

    // Bottom stats row: Difficulty, Max Combo, Level
    elements
        .append(
            "<text x='80' y='310' font-size='11' text-anchor='middle' dominant-baseline='middle' fill='"
                + secondary_color.clone()
                + "'>DIFFICULTY</text>",
        );
    elements.append(create_text(difficulty_name.clone(), "80", "335", "16", "middle", "middle"));

    elements
        .append(
            "<text x='235' y='310' font-size='11' text-anchor='middle' dominant-baseline='middle' fill='"
                + secondary_color.clone()
                + "'>MAX COMBO</text>",
        );
    elements.append(create_text(_max_combo.clone(), "235", "335", "16", "middle", "middle"));

    elements
        .append(
            "<text x='390' y='310' font-size='11' text-anchor='middle' dominant-baseline='middle' fill='"
                + secondary_color
                + "'>LEVEL</text>",
        );
    elements.append(create_text(_level.clone(), "390", "335", "16", "middle", "middle"));

    // Second separator line
    elements.append(create_line("375", accent_color.clone()));

    let mut elements = elements.span();
    let image = create_svg(combine_elements(ref elements), accent_color);

    let base64_image = format!("data:image/svg+xml;base64,{}", bytes_base64_encode(image));

    let mut metadata = JsonImpl::new()
        .add("name", "Game" + " #" + _game_id)
        .add("description", "A " + zone_name.clone() + " " + mode_name.clone() + " game of zKube.")
        .add("image", base64_image);

    let zone_str: ByteArray = JsonImpl::new().add("trait", "Zone").add("value", zone_name).build();
    let mode_str: ByteArray = JsonImpl::new().add("trait", "Mode").add("value", mode_name).build();
    let score_str: ByteArray = JsonImpl::new().add("trait", "Score").add("value", _score).build();
    let level_str: ByteArray = JsonImpl::new().add("trait", "Level").add("value", _level).build();
    let difficulty_str: ByteArray = JsonImpl::new()
        .add("trait", "Difficulty")
        .add("value", difficulty_name)
        .build();
    let max_combo_str: ByteArray = JsonImpl::new()
        .add("trait", "Max Combo")
        .add("value", _max_combo)
        .build();
    let status_str: ByteArray = JsonImpl::new()
        .add("trait", "Status")
        .add("value", _status)
        .build();

    let attributes = array![
        zone_str, mode_str, score_str, level_str, difficulty_str, max_combo_str, status_str,
    ]
        .span();

    let metadata = metadata.add_array("attributes", attributes).build();

    format!("data:application/json;base64,{}", bytes_base64_encode(metadata))
}
