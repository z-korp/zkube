import { Abi } from "starknet";

export const erc721ABI = [
  {
    type: "function",
    name: "pause",
    inputs: [],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "unpause",
    inputs: [],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "struct",
    name: "core::integer::u256",
    members: [
      { name: "low", type: "core::integer::u128" },
      { name: "high", type: "core::integer::u128" },
    ],
  },
  {
    type: "function",
    name: "burn",
    inputs: [{ name: "token_id", type: "core::integer::u256" }],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "minter_mint",
    inputs: [
      {
        name: "recipient",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "public_mint_from",
    inputs: [
      {
        name: "recipient",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "caller",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "public_mint",
    inputs: [
      {
        name: "recipient",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "update_mint_price",
    inputs: [{ name: "new_price", type: "core::integer::u256" }],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "get_purchase_price",
    inputs: [{ name: "token_id", type: "core::integer::u256" }],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "get_mint_price",
    inputs: [],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
  {
    type: "enum",
    name: "core::bool",
    variants: [
      { name: "False", type: "()" },
      { name: "True", type: "()" },
    ],
  },
  {
    type: "function",
    name: "get_is_paused",
    inputs: [],
    outputs: [{ type: "core::bool" }],
    state_mutability: "view",
  },
  {
    type: "impl",
    name: "ERC721MixinImpl",
    interface_name: "openzeppelin_token::erc721::interface::ERC721ABI",
  },
  {
    type: "struct",
    name: "core::array::Span::<core::felt252>",
    members: [
      { name: "snapshot", type: "@core::array::Array::<core::felt252>" },
    ],
  },
  {
    type: "struct",
    name: "core::byte_array::ByteArray",
    members: [
      {
        name: "data",
        type: "core::array::Array::<core::bytes_31::bytes31>",
      },
      { name: "pending_word", type: "core::felt252" },
      { name: "pending_word_len", type: "core::integer::u32" },
    ],
  },
  {
    type: "interface",
    name: "openzeppelin_token::erc721::interface::ERC721ABI",
    items: [
      {
        type: "function",
        name: "balance_of",
        inputs: [
          {
            name: "account",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "owner_of",
        inputs: [{ name: "token_id", type: "core::integer::u256" }],
        outputs: [
          { type: "core::starknet::contract_address::ContractAddress" },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "safe_transfer_from",
        inputs: [
          {
            name: "from",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "to",
            type: "core::starknet::contract_address::ContractAddress",
          },
          { name: "token_id", type: "core::integer::u256" },
          { name: "data", type: "core::array::Span::<core::felt252>" },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "transfer_from",
        inputs: [
          {
            name: "from",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "to",
            type: "core::starknet::contract_address::ContractAddress",
          },
          { name: "token_id", type: "core::integer::u256" },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "approve",
        inputs: [
          {
            name: "to",
            type: "core::starknet::contract_address::ContractAddress",
          },
          { name: "token_id", type: "core::integer::u256" },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "set_approval_for_all",
        inputs: [
          {
            name: "operator",
            type: "core::starknet::contract_address::ContractAddress",
          },
          { name: "approved", type: "core::bool" },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "get_approved",
        inputs: [{ name: "token_id", type: "core::integer::u256" }],
        outputs: [
          { type: "core::starknet::contract_address::ContractAddress" },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "is_approved_for_all",
        inputs: [
          {
            name: "owner",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "operator",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [{ type: "core::bool" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "supports_interface",
        inputs: [{ name: "interface_id", type: "core::felt252" }],
        outputs: [{ type: "core::bool" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "name",
        inputs: [],
        outputs: [{ type: "core::byte_array::ByteArray" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "symbol",
        inputs: [],
        outputs: [{ type: "core::byte_array::ByteArray" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "token_uri",
        inputs: [{ name: "token_id", type: "core::integer::u256" }],
        outputs: [{ type: "core::byte_array::ByteArray" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "balanceOf",
        inputs: [
          {
            name: "account",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "ownerOf",
        inputs: [{ name: "tokenId", type: "core::integer::u256" }],
        outputs: [
          { type: "core::starknet::contract_address::ContractAddress" },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "safeTransferFrom",
        inputs: [
          {
            name: "from",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "to",
            type: "core::starknet::contract_address::ContractAddress",
          },
          { name: "tokenId", type: "core::integer::u256" },
          { name: "data", type: "core::array::Span::<core::felt252>" },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "transferFrom",
        inputs: [
          {
            name: "from",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "to",
            type: "core::starknet::contract_address::ContractAddress",
          },
          { name: "tokenId", type: "core::integer::u256" },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "setApprovalForAll",
        inputs: [
          {
            name: "operator",
            type: "core::starknet::contract_address::ContractAddress",
          },
          { name: "approved", type: "core::bool" },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "getApproved",
        inputs: [{ name: "tokenId", type: "core::integer::u256" }],
        outputs: [
          { type: "core::starknet::contract_address::ContractAddress" },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "isApprovedForAll",
        inputs: [
          {
            name: "owner",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "operator",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [{ type: "core::bool" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "tokenURI",
        inputs: [{ name: "tokenId", type: "core::integer::u256" }],
        outputs: [{ type: "core::byte_array::ByteArray" }],
        state_mutability: "view",
      },
    ],
  },
  {
    type: "impl",
    name: "PausableImpl",
    interface_name: "openzeppelin_security::interface::IPausable",
  },
  {
    type: "interface",
    name: "openzeppelin_security::interface::IPausable",
    items: [
      {
        type: "function",
        name: "is_paused",
        inputs: [],
        outputs: [{ type: "core::bool" }],
        state_mutability: "view",
      },
    ],
  },
  {
    type: "impl",
    name: "AccessControlImpl",
    interface_name:
      "openzeppelin_access::accesscontrol::interface::IAccessControl",
  },
  {
    type: "interface",
    name: "openzeppelin_access::accesscontrol::interface::IAccessControl",
    items: [
      {
        type: "function",
        name: "has_role",
        inputs: [
          { name: "role", type: "core::felt252" },
          {
            name: "account",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [{ type: "core::bool" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_role_admin",
        inputs: [{ name: "role", type: "core::felt252" }],
        outputs: [{ type: "core::felt252" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "grant_role",
        inputs: [
          { name: "role", type: "core::felt252" },
          {
            name: "account",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "revoke_role",
        inputs: [
          { name: "role", type: "core::felt252" },
          {
            name: "account",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "renounce_role",
        inputs: [
          { name: "role", type: "core::felt252" },
          {
            name: "account",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
    ],
  },
  {
    type: "impl",
    name: "ERC721EnumerableImpl",
    interface_name:
      "openzeppelin_token::erc721::extensions::erc721_enumerable::interface::IERC721Enumerable",
  },
  {
    type: "interface",
    name: "openzeppelin_token::erc721::extensions::erc721_enumerable::interface::IERC721Enumerable",
    items: [
      {
        type: "function",
        name: "total_supply",
        inputs: [],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "token_by_index",
        inputs: [{ name: "index", type: "core::integer::u256" }],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "token_of_owner_by_index",
        inputs: [
          {
            name: "owner",
            type: "core::starknet::contract_address::ContractAddress",
          },
          { name: "index", type: "core::integer::u256" },
        ],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view",
      },
    ],
  },
  {
    type: "constructor",
    name: "constructor",
    inputs: [
      {
        name: "default_admin",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "pauser",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "erc20_token",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "tournament_system",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "chest_system",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "zkorp_system",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "play_system",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "minter_system",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    type: "event",
    name: "openzeppelin_token::erc721::erc721::ERC721Component::Transfer",
    kind: "struct",
    members: [
      {
        name: "from",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "key",
      },
      {
        name: "to",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "key",
      },
      { name: "token_id", type: "core::integer::u256", kind: "key" },
    ],
  },
  {
    type: "event",
    name: "openzeppelin_token::erc721::erc721::ERC721Component::Approval",
    kind: "struct",
    members: [
      {
        name: "owner",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "key",
      },
      {
        name: "approved",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "key",
      },
      { name: "token_id", type: "core::integer::u256", kind: "key" },
    ],
  },
  {
    type: "event",
    name: "openzeppelin_token::erc721::erc721::ERC721Component::ApprovalForAll",
    kind: "struct",
    members: [
      {
        name: "owner",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "key",
      },
      {
        name: "operator",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "key",
      },
      { name: "approved", type: "core::bool", kind: "data" },
    ],
  },
  {
    type: "event",
    name: "openzeppelin_token::erc721::erc721::ERC721Component::Event",
    kind: "enum",
    variants: [
      {
        name: "Transfer",
        type: "openzeppelin_token::erc721::erc721::ERC721Component::Transfer",
        kind: "nested",
      },
      {
        name: "Approval",
        type: "openzeppelin_token::erc721::erc721::ERC721Component::Approval",
        kind: "nested",
      },
      {
        name: "ApprovalForAll",
        type: "openzeppelin_token::erc721::erc721::ERC721Component::ApprovalForAll",
        kind: "nested",
      },
    ],
  },
  {
    type: "event",
    name: "openzeppelin_introspection::src5::SRC5Component::Event",
    kind: "enum",
    variants: [],
  },
  {
    type: "event",
    name: "openzeppelin_security::pausable::PausableComponent::Paused",
    kind: "struct",
    members: [
      {
        name: "account",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "openzeppelin_security::pausable::PausableComponent::Unpaused",
    kind: "struct",
    members: [
      {
        name: "account",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "openzeppelin_security::pausable::PausableComponent::Event",
    kind: "enum",
    variants: [
      {
        name: "Paused",
        type: "openzeppelin_security::pausable::PausableComponent::Paused",
        kind: "nested",
      },
      {
        name: "Unpaused",
        type: "openzeppelin_security::pausable::PausableComponent::Unpaused",
        kind: "nested",
      },
    ],
  },
  {
    type: "event",
    name: "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleGranted",
    kind: "struct",
    members: [
      { name: "role", type: "core::felt252", kind: "data" },
      {
        name: "account",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
      {
        name: "sender",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleRevoked",
    kind: "struct",
    members: [
      { name: "role", type: "core::felt252", kind: "data" },
      {
        name: "account",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
      {
        name: "sender",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleAdminChanged",
    kind: "struct",
    members: [
      { name: "role", type: "core::felt252", kind: "data" },
      {
        name: "previous_admin_role",
        type: "core::felt252",
        kind: "data",
      },
      { name: "new_admin_role", type: "core::felt252", kind: "data" },
    ],
  },
  {
    type: "event",
    name: "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::Event",
    kind: "enum",
    variants: [
      {
        name: "RoleGranted",
        type: "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleGranted",
        kind: "nested",
      },
      {
        name: "RoleRevoked",
        type: "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleRevoked",
        kind: "nested",
      },
      {
        name: "RoleAdminChanged",
        type: "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleAdminChanged",
        kind: "nested",
      },
    ],
  },
  {
    type: "event",
    name: "openzeppelin_token::erc721::extensions::erc721_enumerable::erc721_enumerable::ERC721EnumerableComponent::Event",
    kind: "enum",
    variants: [],
  },
  {
    type: "event",
    name: "game_erc721::ZKubeCredits::Event",
    kind: "enum",
    variants: [
      {
        name: "ERC721Event",
        type: "openzeppelin_token::erc721::erc721::ERC721Component::Event",
        kind: "flat",
      },
      {
        name: "SRC5Event",
        type: "openzeppelin_introspection::src5::SRC5Component::Event",
        kind: "flat",
      },
      {
        name: "PausableEvent",
        type: "openzeppelin_security::pausable::PausableComponent::Event",
        kind: "flat",
      },
      {
        name: "AccessControlEvent",
        type: "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::Event",
        kind: "flat",
      },
      {
        name: "ERC721EnumerableEvent",
        type: "openzeppelin_token::erc721::extensions::erc721_enumerable::erc721_enumerable::ERC721EnumerableComponent::Event",
        kind: "flat",
      },
    ],
  },
] as const satisfies Abi;
