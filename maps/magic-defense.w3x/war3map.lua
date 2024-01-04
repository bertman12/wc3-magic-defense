function InitGlobals()
end

function CreateUnitsForPlayer0()
local p = Player(0)
local u
local unitID
local t
local life

u = BlzCreateUnitWithSkin(p, FourCC("hspt"), -1.3, 12.2, 231.126, FourCC("hspt"))
u = BlzCreateUnitWithSkin(p, FourCC("hspt"), -253.5, 259.7, 231.126, FourCC("hspt"))
u = BlzCreateUnitWithSkin(p, FourCC("hspt"), 243.5, 253.2, 231.126, FourCC("hspt"))
u = BlzCreateUnitWithSkin(p, FourCC("hspt"), 244.9, -283.1, 231.126, FourCC("hspt"))
u = BlzCreateUnitWithSkin(p, FourCC("hspt"), -253.7, -278.0, 231.126, FourCC("hspt"))
u = BlzCreateUnitWithSkin(p, FourCC("hspt"), 14.1, -438.3, 231.126, FourCC("hspt"))
u = BlzCreateUnitWithSkin(p, FourCC("hspt"), 392.0, -9.9, 231.126, FourCC("hspt"))
u = BlzCreateUnitWithSkin(p, FourCC("hspt"), -386.8, 9.1, 231.126, FourCC("hspt"))
u = BlzCreateUnitWithSkin(p, FourCC("hspt"), 1.5, 409.0, 231.126, FourCC("hspt"))
end

function CreatePlayerBuildings()
end

function CreatePlayerUnits()
CreateUnitsForPlayer0()
end

function CreateAllUnits()
CreatePlayerBuildings()
CreatePlayerUnits()
end

function InitCustomPlayerSlots()
SetPlayerStartLocation(Player(0), 0)
SetPlayerColor(Player(0), ConvertPlayerColor(0))
SetPlayerRacePreference(Player(0), RACE_PREF_HUMAN)
SetPlayerRaceSelectable(Player(0), true)
SetPlayerController(Player(0), MAP_CONTROL_USER)
end

function InitCustomTeams()
SetPlayerTeam(Player(0), 0)
end

function main()
SetCameraBounds(-29952.0 + GetCameraMargin(CAMERA_MARGIN_LEFT), -30208.0 + GetCameraMargin(CAMERA_MARGIN_BOTTOM), 29952.0 - GetCameraMargin(CAMERA_MARGIN_RIGHT), 29696.0 - GetCameraMargin(CAMERA_MARGIN_TOP), -29952.0 + GetCameraMargin(CAMERA_MARGIN_LEFT), 29696.0 - GetCameraMargin(CAMERA_MARGIN_TOP), 29952.0 - GetCameraMargin(CAMERA_MARGIN_RIGHT), -30208.0 + GetCameraMargin(CAMERA_MARGIN_BOTTOM))
SetDayNightModels("Environment\\DNC\\DNCDalaran\\DNCDalaranTerrain\\DNCDalaranTerrain.mdl", "Environment\\DNC\\DNCDalaran\\DNCDalaranUnit\\DNCDalaranUnit.mdl")
NewSoundEnvironment("Default")
SetAmbientDaySound("DalaranRuinsDay")
SetAmbientNightSound("DalaranRuinsNight")
SetMapMusic("Music", true, 0)
CreateAllUnits()
InitBlizzard()
InitGlobals()
end

function config()
SetMapName("TRIGSTR_001")
SetMapDescription("TRIGSTR_003")
SetPlayers(1)
SetTeams(1)
SetGamePlacement(MAP_PLACEMENT_USE_MAP_SETTINGS)
DefineStartLocation(0, 0.0, 0.0)
InitCustomPlayerSlots()
SetPlayerSlotAvailable(Player(0), MAP_CONTROL_USER)
InitGenericPlayerSlots()
end

