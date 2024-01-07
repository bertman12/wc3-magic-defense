
export enum WTS_Units{
	BloodElfSurvivor = FourCC("H000"),
	ManaCoreFoundation = FourCC("n000"),
	DepletedManaCore = FourCC("u000"),
	DefunctTower = FourCC("n001"),
	Wall = FourCC("h001"),
	ImprovedWall1 = FourCC("h003"),
	ManaWall1 = FourCC("h002"),
	TowerBase = FourCC("h004"),
	ManaTower = FourCC("h006"),
	CripplingTower = FourCC("h007"),
	SummoningTower = FourCC("h008"),
	LightningTower = FourCC("h009"),
	ArmorPiercingTower = FourCC("h00A"),
	MultishotTower = FourCC("h00B"),
	FreezingTower = FourCC("h00C"),
	FlameWall = FourCC("h00D"),
	UpgradeCenter = FourCC("h00E"),
	ItemShop = FourCC("h00F"),
	TestingParser = FourCC("h00G"),
}

export enum WTS_Items{
	KineticBlade = FourCC("I000"),
	PersonalManaShield_I = FourCC("I001"),
	PersonalFountain_I = FourCC("I002"),
	MultishotItem_I = FourCC("I003"),
	FlameShield_I = FourCC("I004"),
	FlameRune = FourCC("I005"),
}

export enum WTS_Destructibles{
	WinterTreeWallCustom = FourCC("B000"),
}

export enum WTS_Doodads{
	TrashCustom = FourCC("D000"),
}

export enum WTS_Abilities{
	Teleport = FourCC("A002"),
	Multishot = FourCC("A000"),
	FlameRun = FourCC("A001"),
}

export enum WTS_Buffs_Effects{
	OmgMyNewEffect = FourCC("X000"),
	NewBuffBaby = FourCC("B000"),
}

export enum WTS_Upgrades{
	TowerDamage = FourCC("R000"),
	BaseNull = FourCC("R001"),
	TowerRange = FourCC("R002"),
	ImprovedManaReserves = FourCC("R003"),
	AdvancedItemShop = FourCC("R004"),
	MaxCores = FourCC("R005"),
}
