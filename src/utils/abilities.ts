import { UNITS } from "src/shared/enums";
import { MapPlayer, Timer, Trigger, Unit } from "w3ts";

export function unitGetsNearThisUnit(
  unit: Unit,
  range: number,
  cb: (u: Unit) => void,
  config?: {
    uniqueUnitsOnly: boolean;
    filter?: boolexpr | (() => boolean);
    onDestroy?: (unitsEffected: Unit[]) => void;
  }
) {
  const trig = Trigger.create();

  /**
   * A unique set of the units effected
   */
  const effectedUnitPool: Unit[] = [];

  trig.registerUnitInRage(unit.handle, range, config?.filter ?? (() => true));

  trig.addAction(() => {
    const u = Unit.fromEvent();

    if (!u) {
      return;
    }

    if (!effectedUnitPool.includes(u)) {
      effectedUnitPool.push(u);
    }

    if (config?.uniqueUnitsOnly && !effectedUnitPool.includes(u)) {
      cb(u);
    } else {
      cb(u);
    }
  });

  function destroy() {
    if (config?.onDestroy) {
      config?.onDestroy(effectedUnitPool);
    }
    trig.destroy();
  }

  return {
    cleanupUnitGetsNearThisUnit: (delay?: number) => {
      if (delay) {
        const timer = Timer.create();
        timer.start(delay, false, () => {
          destroy();
          timer.destroy();
        });
        return;
      }
      destroy();
    },
  };
}

/**
 *
 * @param cb
 * @param abilityId
 * @param dummyLifeTime Maybe be necessary to have a long lifetime so spells like chain lightning will have time to bounce to all targets
 * @param owner
 */
export function useTempDummyUnit(
  cb: (dummy: Unit) => void,
  abilityId: number,
  dummyLifeTime: number,
  owner: MapPlayer,
  x: number,
  y: number,
  facing: number,
  config?: { abilityLevel?: number; modelType?: "cenariusGhost" }
) {
  let dummy: Unit | undefined = undefined;

  if (config?.modelType === "cenariusGhost") {
    dummy = Unit.create(owner, UNITS.dummyCaster_cenariusGhost, x, y, facing);
    dummy?.setScale(1, 1, 1);
  } else {
    dummy = Unit.create(owner, UNITS.dummyCaster, x, y, facing);
  }

  const t = Timer.create();

  if (dummy) {
    dummy.addAbility(abilityId);
    dummy.setAbilityManaCost(
      abilityId,
      config?.abilityLevel ? config.abilityLevel - 1 : 0,
      0
    );
    cb(dummy);

    t.start(dummyLifeTime, false, () => {
      dummy?.destroy();
      t.destroy();
    });
  }
}

/**
 * Creates a trigger to monitor when a unit is attacked
 *
 * We could also have all functions execute in this single trigger's context instead of creating new triggers each time the function is used.
 * @param cb
 * @param config
 */
export function onUnitAttacked(
  cb: (attacker: Unit, victim: Unit) => void,
  config: { attackerCooldown?: boolean; procChance?: number }
) {
  const attackerTriggerCooldown = new Set<Unit>();
  const t = Trigger.create();

  t.registerAnyUnitEvent(EVENT_PLAYER_UNIT_ATTACKED);

  t.addAction(() => {
    const attacker = Unit.fromHandle(GetAttacker());
    const victim = Unit.fromHandle(GetAttackedUnitBJ());

    if (!attacker || !victim) {
      return;
    }

    //Attack was not below the proc chance, and thus we will not use the cb function
    if (
      config.procChance &&
      Math.ceil(Math.random() * 100) >= config.procChance
    ) {
      return;
    }

    //Attacker has already used the trigger
    if (config.attackerCooldown && attackerTriggerCooldown.has(attacker)) {
      return;
    }

    attackerTriggerCooldown.add(attacker);

    //Finally, after all conditions have been met, use the cb function
    cb(attacker, victim);

    const t = Timer.create();

    //removes the attacker from the cooldown group after 1/3 of that units attack cooldown has passed.
    t.start(attacker.getAttackCooldown(0) / 3, false, () => {
      attackerTriggerCooldown.delete(attacker);
      t.destroy();
    });
  });
}
