import { FUHooks } from '../hooks.mjs';
import { Targeting } from '../helpers/targeting.mjs';

/**
 * @description Contains information about a target in a combat event
 * @typedef EventTarget
 * @property {Token} token
 * @property {FUActor} actor
 * @property {TargetData|null} data
 */

/**
 * @typedef ItemReference
 * @property {String} name
 * @property {String} fuid
 */

/**
 * @param {FUItem} item
 * @returns {ItemReference}
 */
function toItemReference(item) {
	return {
		name: item.name,
		fuid: item.system.fuid,
	};
}

/**
 * @description Dispatched when an actor makes an attack (skill/spell)
 * @typedef AttackEvent
 * @property {ItemReference} item
 * @property {FU.damageTypes} type
 * @property {Set<String>} traits
 * @property {FUActor} actor
 * @property {Token} token
 * @property {EventTarget[]} targets
 */

/**
 * @description Dispatches an event to signal an attack event
 * @param {CheckInspector} inspector
 * @param {FUActor} actor
 * @param {FUItem} item
 */
function attack(inspector, actor, item) {
	const traits = inspector.getTraits();
	const targets = inspector.getTargets();
	const eventTargets = getEventTargets(targets);

	/** @type AttackEvent  **/
	const event = {
		item: toItemReference(item),
		actor: actor,
		type: inspector.getDamage()?.type,
		token: actor.resolveToken(),
		targets: eventTargets,
		traits: new Set(traits),
	};
	Hooks.call(FUHooks.ATTACK_EVENT, event);
}

/**
 * @description Dispatched when an actor suffers damage
 * @typedef DamageEvent
 * @property {FU.damageTypes} type
 * @property {Number} amount
 * @property {FUActor} actor
 * @property {Token} token
 * @property {Set<String>} traits
 * @property {EventTarget|null} source
 */

/**
 * @description Dispatches an event to signal damage taken by an actor
 * @param {FU.damageTypes} type
 * @param {Number} amount
 * @param {Set<String>} traits
 * @param {FUActor} actor
 * @param {FUActor} sourceActor
 */
function damage(type, amount, traits, actor, sourceActor) {
	const source = getEventTargetFromActor(sourceActor);
	/** @type DamageEvent  **/
	const damageEvent = {
		amount: amount,
		type: type,
		actor: actor,
		token: actor.resolveToken(),
		source: source,
		traits: traits,
	};
	Hooks.call(FUHooks.DAMAGE_EVENT, damageEvent);
}

/**
 * @description Dispatched when an actor enters crisis
 * @typedef CrisisEvent
 * @property {FUActor} actor
 * @property {Token} token
 */

/**
 * @description Dispatched when an actor is reduced to 0 HP
 * @typedef DefeatEvent
 * @property {FUActor} actor
 * @property {Token} token
 */

/**
 * @description Dispatched when an actor has a status toggled.
 * @typedef StatusEvent
 * @property {FUActor} actor
 * @property {Token} token
 * @property {String} status The id of the status effect
 * @property {String} enabled Whether the effect is enabled
 */

/**
 * @description Dispatches an event to signal an effect has been applied onto an actor
 * @param {FUActor} actor
 * @param {String} statusEffectId
 * @param {Boolean} enabled
 */
function status(actor, statusEffectId, enabled) {
	Hooks.call(
		FUHooks.STATUS_EVENT,
		/** @type StatusEvent **/
		{
			actor: actor,
			token: actor.resolveToken(),
			status: statusEffectId,
			enabled: enabled,
		},
	);
}

/**
 * @description Dispatched when an actor recovers resources (such as HP, MP)
 * @typedef GainEvent
 * @property {FU.resources} resource
 * @property {Number} amount
 * @property {FUActor} actor
 * @property {Token} token
 */

/**
 *
 * @param {FUActor} actor
 * @param {String} resource
 * @param {Number} amount
 */
function gain(actor, resource, amount) {
	/** @type GainEvent  **/
	const gainEvent = {
		amount: amount,
		resource: resource,
		actor: actor,
		token: actor.resolveToken(),
	};
	Hooks.call(FUHooks.GAIN_EVENT, gainEvent);
}

/**
 * @description Dispatched when an actor gains resources (such as HP, MP)
 * @typedef LossEvent
 * @property {FU.resources} resource
 * @property {Number} amount
 * @property {FUActor} actor
 * @property {Token} token
 */

/**
 * @description Dispatched when an actor loses resources (such as HP, MP)
 * @param {FUActor} actor
 * @param {String} resource
 * @param {Number} amount
 */
function loss(actor, resource, amount) {
	/** @type LossEvent  **/
	const lossEvent = {
		amount: amount,
		resource: resource,
		actor: actor,
		token: actor.resolveToken(),
	};
	Hooks.call(FUHooks.LOSS_EVENT, lossEvent);
}

/**
 * @description Dispatched when an actor performs a spell without a magic check.
 * @typedef SpellEvent
 * @property {ItemReference} item
 * @property {Set<String>} traits
 * @property {FUActor} actor
 * @property {Token} token
 * @property {EventTarget[]} targets
 */

/**
 * @description Dispatches an event to signal a spell event
 * @param {FUActor} actor
 * @param {FUItem} item
 */
function spell(actor, item) {
	/** @type SpellDataModel **/
	const spell = item.system;
	const traits = new Set();
	traits.add('spell');
	traits.add(spell.cost.resource);

	const targets = Targeting.getSerializedTargetData();
	const eventTargets = getEventTargets(targets);

	/** @type SpellEvent  **/
	const event = {
		item: toItemReference(item),
		actor: actor,
		token: actor.resolveToken(),
		targets: eventTargets,
		traits: traits,
	};
	Hooks.call(FUHooks.SPELL_EVENT, event);
}

/**
 * @param {TargetData[]} targets
 * @returns {EventTarget[]}
 */
function getEventTargets(targets) {
	return targets.map((t) => {
		const actor = fromUuidSync(t.uuid);
		const token = actor.resolveToken();
		/** @type EventTarget  **/
		return {
			actor: actor,
			token: token,
			data: t,
		};
	});
}

/** *
 * @param {FUActor} actor
 * @returns {EventTarget}
 */
function getEventTargetFromActor(actor) {
	if (!actor) {
		return null;
	}
	const token = actor.resolveToken();
	return {
		actor: actor,
		token: token,
	};
}

export const CommonEvents = Object.freeze({
	attack,
	damage,
	status,
	gain,
	loss,
	spell,
});
