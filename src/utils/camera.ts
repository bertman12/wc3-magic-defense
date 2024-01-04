import { forEachPlayer } from "src/utils/players";
import { Trigger } from "w3ts";

export function trig_setCameraDistance() {
    const t = Trigger.create();
    forEachPlayer((p) => {
        t.registerPlayerChatEvent(p, "-cam", false);

        t.addAction(() => {
            const str = GetEventPlayerChatString();
            const triggeringPlayer = GetTriggerPlayer();
            if (str && triggeringPlayer) {
                const [command, distance] = str?.split(" ");
                const distanceAsNumber = Number(distance);

                if (typeof distanceAsNumber !== "number") {
                    print("distance must be a number");
                    return;
                }

                SetCameraFieldForPlayer(triggeringPlayer, CAMERA_FIELD_FARZ, 10000, 0.25);
                SetCameraFieldForPlayer(triggeringPlayer, CAMERA_FIELD_TARGET_DISTANCE, distanceAsNumber, 0.25);
            }
        });
    });
}
