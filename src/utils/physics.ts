import { Timer, Unit } from "w3ts";
import { OrderId } from "w3ts/globals";

interface ApplyForceConfig {
    /**
     * Default: 0
     */
    sustainedForceDuration?: number;
    /**
     * Default: 600
     */
    frictionConstant?: number;
    obeyPathing?: boolean;
    whileActive?: (currentSpeed?: number, timeElapsed?: number) => void;
    onStart?: (currentSpeed?: number, timeElapsed?: number) => void;
    onEnd?: (currentSpeed?: number, timeElapsed?: number) => void;
}

/**
 * @param angle degrees
 * @param unit
 * @param initialSpeed meters per second
 * @param affectHeight determines whether or not to change unit height whilst force is applied
 */
export function applyForce(angle: number, unit: Unit, initialSpeed: number, config?: ApplyForceConfig) {
    const timer = Timer.create();
    const refreshInterval = 0.01;
    const updatesPerSecond = 1 / refreshInterval;
    const frictionConstant = 1200; //meters per second friction decay
    let currentSpeed = initialSpeed;
    let timeElapsed = 0;

    const clickMoveOrder = 851971;
    const moveOrders = [OrderId.Move, OrderId.Attackground, OrderId.Patrol, OrderId.Attack, clickMoveOrder];

    //Cancel unit commands - if a unit already has a move command and are applied a force, they will bug out sometimes and walk in the opposite direction
    unit.issueImmediateOrder(OrderId.Stop);

    timer.start(refreshInterval, true, () => {
        //if the unit's move speed vector is greater than the remaining applied force vector then we may stop the applied force function; should only run while the unit has the move order
        if (config?.obeyPathing && currentSpeed > unit.moveSpeed) {
            unit.issueImmediateOrder(OrderId.Stop);
        }

        const xVelocity = (currentSpeed / updatesPerSecond) * Math.cos(Deg2Rad(angle));
        const yVelocity = (currentSpeed / updatesPerSecond) * Math.sin(Deg2Rad(angle));

        //On end hook runs before the timer is destroyed and the function ends
        if (config?.onEnd && currentSpeed <= 0) {
            config.onEnd(currentSpeed, timeElapsed);
        }

        //Complete execution when current speed of the initial force has decayed
        if (currentSpeed <= 0) {
            timer.destroy();
            return;
        }

        //Runs when the force is first applied
        if (config?.onStart && currentSpeed === initialSpeed) {
            config.onStart(currentSpeed, timeElapsed);
        }

        //Runs at any point while the function is executing
        if (config?.whileActive) {
            config.whileActive(currentSpeed, timeElapsed);
        }

        unit.x += xVelocity;
        unit.y += yVelocity;

        timeElapsed += refreshInterval;

        if (config?.sustainedForceDuration && timeElapsed <= config.sustainedForceDuration) {
            return;
        }

        currentSpeed -= frictionConstant / updatesPerSecond;
    });
}



// const unitIsMovingVector_x = (unit.moveSpeed / updatesPerSecond) * Math.cos(Deg2Rad(unit.facing));
// const unitIsMovingVector_y = (unit.moveSpeed / updatesPerSecond) * Math.sin(Deg2Rad(unit.facing));
// if ((moveOrders.includes(unit.currentOrder) && unitIsMovingVector_x > xVelocity) || unitIsMovingVector_y > yVelocity) {
//     print("moving velocity exceeded applied force velocity");
//     timer.destroy();

//     return;
// }
