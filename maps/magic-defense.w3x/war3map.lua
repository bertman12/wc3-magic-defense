function InitGlobals()
end

function CreateAllItems()
local itemID

BlzCreateItemWithSkin(FourCC("I000"), -1303.9, -25.5, FourCC("I000"))
BlzCreateItemWithSkin(FourCC("I001"), -1347.7, -170.8, FourCC("I001"))
BlzCreateItemWithSkin(FourCC("I002"), -1179.9, 52.9, FourCC("I002"))
BlzCreateItemWithSkin(FourCC("I003"), -1030.0, 174.7, FourCC("I003"))
BlzCreateItemWithSkin(FourCC("I005"), -871.8, 292.4, FourCC("I005"))
end

function CreateNeutralPassiveBuildings()
local p = Player(PLAYER_NEUTRAL_PASSIVE)
local u
local unitID
local t
local life

u = BlzCreateUnitWithSkin(p, FourCC("n001"), -3136.0, -64.0, 270.000, FourCC("n001"))
SetResourceAmount(u, 12500)
u = BlzCreateUnitWithSkin(p, FourCC("n000"), -2560.0, -512.0, 270.000, FourCC("n000"))
SetResourceAmount(u, 12500)
end

function CreatePlayerBuildings()
end

function CreatePlayerUnits()
end

function CreateAllUnits()
CreateNeutralPassiveBuildings()
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
SetTerrainFogEx(0, 5000.0, 6000.0, 0.500, 0.000, 0.000, 0.000)
NewSoundEnvironment("Default")
SetAmbientDaySound("DalaranRuinsDay")
SetAmbientNightSound("DalaranRuinsNight")
SetMapMusic("Music", true, 0)
CreateAllItems()
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

