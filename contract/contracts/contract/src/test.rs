#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, testutils::Ledger, Env, String};

#[test]
fn test_create_prediction() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(PredictionPlatform, ());
    let client = PredictionPlatformClient::new(&env, &contract_id);
    let creator = Address::generate(&env);

    client.init();
    let id = client.create_prediction(
        &creator,
        &String::from_str(&env, "XLM"),
        &String::from_str(&env, "UP"),
        &100_0000000,
        &50_0000000,
        &(env.ledger().timestamp() + 1000),
    );
    assert_eq!(id, 1);

    let pred = client.get_prediction(&1);
    assert_eq!(pred.creator, creator);
    assert_eq!(pred.asset, String::from_str(&env, "XLM"));
    assert_eq!(pred.direction, String::from_str(&env, "UP"));
    assert_eq!(pred.stake, 50_0000000);
    assert_eq!(pred.resolved, false);
}

#[test]
fn test_back_prediction() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(PredictionPlatform, ());
    let client = PredictionPlatformClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    let backer = Address::generate(&env);

    client.init();
    client.create_prediction(
        &creator,
        &String::from_str(&env, "BTC"),
        &String::from_str(&env, "DOWN"),
        &500000_0000000,
        &100_0000000,
        &(env.ledger().timestamp() + 1000),
    );

    client.back_prediction(&backer, &1, &25_0000000);
    let pred = client.get_prediction(&1);
    assert_eq!(pred.total_pool, 25_0000000);
}

#[test]
fn test_resolve_prediction_correct() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(PredictionPlatform, ());
    let client = PredictionPlatformClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    let backer1 = Address::generate(&env);
    let backer2 = Address::generate(&env);

    client.init();
    client.create_prediction(
        &creator,
        &String::from_str(&env, "ETH"),
        &String::from_str(&env, "UP"),
        &3000_0000000,
        &100_0000000,
        &(env.ledger().timestamp() + 100),
    );
    client.back_prediction(&backer1, &1, &50_0000000);
    client.back_prediction(&backer2, &1, &30_0000000);

    env.ledger().set_timestamp(env.ledger().timestamp() + 200);

    client.resolve_prediction(&creator, &1, &true);
    let pred = client.get_prediction(&1);
    assert_eq!(pred.resolved, true);
    assert_eq!(pred.outcome, true);
}

#[test]
fn test_resolve_prediction_incorrect() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(PredictionPlatform, ());
    let client = PredictionPlatformClient::new(&env, &contract_id);
    let creator = Address::generate(&env);

    client.init();
    client.create_prediction(
        &creator,
        &String::from_str(&env, "SOL"),
        &String::from_str(&env, "UP"),
        &150_0000000,
        &20_0000000,
        &(env.ledger().timestamp() + 100),
    );

    env.ledger().set_timestamp(env.ledger().timestamp() + 200);
    client.resolve_prediction(&creator, &1, &false);
    let pred = client.get_prediction(&1);
    assert_eq!(pred.resolved, true);
    assert_eq!(pred.outcome, false);
}

#[test]
fn test_claim_rewards_correct_backer() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(PredictionPlatform, ());
    let client = PredictionPlatformClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    let backer = Address::generate(&env);

    client.init();
    client.create_prediction(
        &creator,
        &String::from_str(&env, "XLM"),
        &String::from_str(&env, "UP"),
        &100_0000000,
        &40_0000000,
        &(env.ledger().timestamp() + 100),
    );
    client.back_prediction(&backer, &1, &60_0000000);

    env.ledger().set_timestamp(env.ledger().timestamp() + 200);
    client.resolve_prediction(&creator, &1, &true);

    let reward = client.claim_rewards(&backer, &1);
    assert!(reward > 0);
}

#[test]
fn test_claim_rewards_losing_backer_gets_zero() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(PredictionPlatform, ());
    let client = PredictionPlatformClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    let backer = Address::generate(&env);

    client.init();
    client.create_prediction(
        &creator,
        &String::from_str(&env, "BTC"),
        &String::from_str(&env, "DOWN"),
        &500000_0000000,
        &30_0000000,
        &(env.ledger().timestamp() + 100),
    );
    client.back_prediction(&backer, &1, &20_0000000);

    env.ledger().set_timestamp(env.ledger().timestamp() + 200);
    client.resolve_prediction(&creator, &1, &false);

    let reward = client.claim_rewards(&backer, &1);
    assert_eq!(reward, 0);
}

#[test]
fn test_prediction_count_increments() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(PredictionPlatform, ());
    let client = PredictionPlatformClient::new(&env, &contract_id);
    let creator = Address::generate(&env);

    client.init();
    assert_eq!(client.get_prediction_count(), 0);

    client.create_prediction(
        &creator,
        &String::from_str(&env, "XLM"),
        &String::from_str(&env, "UP"),
        &50_0000000,
        &10_0000000,
        &(env.ledger().timestamp() + 1000),
    );
    assert_eq!(client.get_prediction_count(), 1);

    client.create_prediction(
        &creator,
        &String::from_str(&env, "BTC"),
        &String::from_str(&env, "DOWN"),
        &400000_0000000,
        &20_0000000,
        &(env.ledger().timestamp() + 2000),
    );
    assert_eq!(client.get_prediction_count(), 2);
}

#[test]
#[should_panic(expected = "prediction already resolved")]
fn test_cannot_resolve_twice() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(PredictionPlatform, ());
    let client = PredictionPlatformClient::new(&env, &contract_id);
    let creator = Address::generate(&env);

    client.init();
    client.create_prediction(
        &creator,
        &String::from_str(&env, "XLM"),
        &String::from_str(&env, "UP"),
        &100_0000000,
        &10_0000000,
        &(env.ledger().timestamp() + 100),
    );

    env.ledger().set_timestamp(env.ledger().timestamp() + 200);
    client.resolve_prediction(&creator, &1, &true);
    client.resolve_prediction(&creator, &1, &false);
}

#[test]
#[should_panic(expected = "deadline not passed")]
fn test_cannot_resolve_before_deadline() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(PredictionPlatform, ());
    let client = PredictionPlatformClient::new(&env, &contract_id);
    let creator = Address::generate(&env);

    client.init();
    client.create_prediction(
        &creator,
        &String::from_str(&env, "ETH"),
        &String::from_str(&env, "UP"),
        &3000_0000000,
        &10_0000000,
        &(env.ledger().timestamp() + 1000),
    );

    client.resolve_prediction(&creator, &1, &true);
}

#[test]
#[should_panic(expected = "only creator can resolve")]
fn test_non_creator_cannot_resolve() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(PredictionPlatform, ());
    let client = PredictionPlatformClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    let stranger = Address::generate(&env);

    client.init();
    client.create_prediction(
        &creator,
        &String::from_str(&env, "XLM"),
        &String::from_str(&env, "UP"),
        &100_0000000,
        &10_0000000,
        &(env.ledger().timestamp() + 1000),
    );

    env.ledger().set_timestamp(env.ledger().timestamp() + 2000);
    client.resolve_prediction(&stranger, &1, &true);
}

#[test]
#[should_panic(expected = "prediction not found")]
fn test_get_nonexistent_prediction() {
    let env = Env::default();
    let contract_id = env.register(PredictionPlatform, ());
    let client = PredictionPlatformClient::new(&env, &contract_id);
    client.init();
    client.get_prediction(&999);
}

#[test]
fn test_double_claim_returns_zero() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(PredictionPlatform, ());
    let client = PredictionPlatformClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    let backer = Address::generate(&env);

    client.init();
    client.create_prediction(
        &creator,
        &String::from_str(&env, "XLM"),
        &String::from_str(&env, "UP"),
        &100_0000000,
        &40_0000000,
        &(env.ledger().timestamp() + 100),
    );
    client.back_prediction(&backer, &1, &60_0000000);

    env.ledger().set_timestamp(env.ledger().timestamp() + 200);
    client.resolve_prediction(&creator, &1, &true);

    let first_claim = client.claim_rewards(&backer, &1);
    assert!(first_claim > 0);

    let second_claim = client.claim_rewards(&backer, &1);
    assert_eq!(second_claim, 0);
}

#[test]
fn test_get_user_backings() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(PredictionPlatform, ());
    let client = PredictionPlatformClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    let backer = Address::generate(&env);

    client.init();
    client.create_prediction(
        &creator,
        &String::from_str(&env, "XLM"),
        &String::from_str(&env, "UP"),
        &100_0000000,
        &30_0000000,
        &(env.ledger().timestamp() + 1000),
    );
    client.create_prediction(
        &creator,
        &String::from_str(&env, "BTC"),
        &String::from_str(&env, "DOWN"),
        &500000_0000000,
        &20_0000000,
        &(env.ledger().timestamp() + 2000),
    );

    client.back_prediction(&backer, &1, &10_0000000);
    client.back_prediction(&backer, &2, &15_0000000);

    let backings = client.get_user_backings(&backer);
    assert_eq!(backings.len(), 2);
}
