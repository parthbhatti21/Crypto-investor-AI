#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, MuxedAddress, String, Vec};

#[contracttype]
#[derive(Clone)]
pub struct Prediction {
    pub id: u64,
    pub creator: Address,
    pub asset: String,
    pub direction: String,
    pub target_price: i128,
    pub stake: i128,
    pub total_pool: i128,
    pub deadline: u64,
    pub resolved: bool,
    pub outcome: bool,
}

#[contracttype]
pub enum DataKey {
    Count,
    Token,
    Prediction(u64),
    Backing(u64, Address),
    Claimed(u64, Address),
    UserBackings(Address),
}

#[contract]
pub struct PredictionPlatform;

#[contractimpl]
impl PredictionPlatform {
    pub fn init(env: Env, token: Address) {
        env.storage().instance().set(&DataKey::Count, &0_u64);
        env.storage().instance().set(&DataKey::Token, &token);
    }

    /// Token used to escrow stakes and pay out rewards (the native XLM Stellar Asset Contract on deploy).
    fn token_client(env: &Env) -> token::TokenClient<'_> {
        let token_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .expect("token not set");
        token::TokenClient::new(env, &token_address)
    }

    pub fn create_prediction(
        env: Env,
        creator: Address,
        asset: String,
        direction: String,
        target_price: i128,
        stake: i128,
        deadline: u64,
    ) -> u64 {
        creator.require_auth();

        // Escrow the creator's stake in the contract.
        let contract_address = env.current_contract_address();
        Self::token_client(&env).transfer(&creator, &MuxedAddress::from(contract_address), &stake);

        let id: u64 = env.storage().instance().get(&DataKey::Count).unwrap_or(0) + 1;

        let pred = Prediction {
            id,
            creator: creator.clone(),
            asset,
            direction,
            target_price,
            stake,
            total_pool: 0,
            deadline,
            resolved: false,
            outcome: false,
        };

        // Track user's prediction IDs
        let mut user_preds: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::UserBackings(creator.clone()))
            .unwrap_or(Vec::new(&env));
        user_preds.push_back(id);
        env.storage()
            .persistent()
            .set(&DataKey::UserBackings(creator.clone()), &user_preds);

        env.storage()
            .instance()
            .set(&DataKey::Prediction(id), &pred);
        env.storage().instance().set(&DataKey::Count, &id);
        id
    }

    pub fn back_prediction(env: Env, backer: Address, prediction_id: u64, amount: i128) {
        backer.require_auth();
        let mut pred: Prediction = env
            .storage()
            .instance()
            .get(&DataKey::Prediction(prediction_id))
            .expect("prediction not found");
        assert!(!pred.resolved, "prediction already resolved");

        // Escrow the backer's stake in the contract.
        let contract_address = env.current_contract_address();
        Self::token_client(&env).transfer(&backer, &MuxedAddress::from(contract_address), &amount);

        pred.total_pool += amount;
        env.storage()
            .instance()
            .set(&DataKey::Prediction(prediction_id), &pred);

        let existing: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Backing(prediction_id, backer.clone()))
            .unwrap_or(0);
        env.storage().persistent().set(
            &DataKey::Backing(prediction_id, backer.clone()),
            &(existing + amount),
        );

        // Track in user backings list
        let mut user_backings: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::UserBackings(backer.clone()))
            .unwrap_or(Vec::new(&env));
        if !user_backings.contains(&prediction_id) {
            user_backings.push_back(prediction_id);
            env.storage()
                .persistent()
                .set(&DataKey::UserBackings(backer), &user_backings);
        }
    }

    pub fn resolve_prediction(env: Env, caller: Address, prediction_id: u64, outcome: bool) {
        caller.require_auth();
        let mut pred: Prediction = env
            .storage()
            .instance()
            .get(&DataKey::Prediction(prediction_id))
            .expect("prediction not found");
        assert!(!pred.resolved, "prediction already resolved");
        assert_eq!(pred.creator, caller, "only creator can resolve");
        assert!(
            env.ledger().timestamp() >= pred.deadline,
            "deadline not passed"
        );

        pred.resolved = true;
        pred.outcome = outcome;
        env.storage()
            .instance()
            .set(&DataKey::Prediction(prediction_id), &pred);
    }

    pub fn claim_rewards(env: Env, backer: Address, prediction_id: u64) -> i128 {
        backer.require_auth();
        let pred: Prediction = env
            .storage()
            .instance()
            .get(&DataKey::Prediction(prediction_id))
            .expect("prediction not found");
        assert!(pred.resolved, "prediction not resolved yet");

        let already_claimed: bool = env
            .storage()
            .persistent()
            .get(&DataKey::Claimed(prediction_id, backer.clone()))
            .unwrap_or(false);
        if already_claimed {
            return 0;
        }

        env.storage().persistent().set(
            &DataKey::Claimed(prediction_id, backer.clone()),
            &true,
        );

        if !pred.outcome {
            return 0;
        }

        let backer_stake: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Backing(prediction_id, backer.clone()))
            .unwrap_or(0);
        if backer_stake == 0 || pred.total_pool == 0 {
            return 0;
        }

        let reward = (backer_stake * (pred.stake + pred.total_pool)) / pred.total_pool;
        if reward > 0 {
            let contract_address = env.current_contract_address();
            Self::token_client(&env).transfer(&contract_address, &MuxedAddress::from(backer), &reward);
        }
        reward
    }

    pub fn get_prediction(env: Env, id: u64) -> Prediction {
        env.storage()
            .instance()
            .get(&DataKey::Prediction(id))
            .expect("prediction not found")
    }

    pub fn get_prediction_count(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::Count).unwrap_or(0)
    }

    pub fn get_user_backings(env: Env, user: Address) -> Vec<u64> {
        env.storage()
            .persistent()
            .get(&DataKey::UserBackings(user))
            .unwrap_or(Vec::new(&env))
    }
}

mod test;
