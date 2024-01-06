
export enum WTS_Units{
	BloodElfSurvivor = FourCC("H000"),
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
	ItemShop = FourCC("h00F"),
	testingparser = FourCC("h00G"),
}

export enum WTS_Items{
	KineticBlade = FourCC("I000"),
	PersonalManaShield_I = FourCC("I001"),
	PersonalFountain_I = FourCC("I002"),
	FlameShield_I = FourCC("I004"),
	FlameRune = FourCC("I005"),
}

export enum WTS_Abilities{
	Multishot = FourCC("A000"),
	Fla_rm_re_r_r_ = FourCC("A001"),
}

export enum WTS_Upgrades{
	Chaos = FourCC("R001"),
	LongRifles = FourCC("R002"),
	WellSpring = FourCC("R003"),
	Chaos_R004 = FourCC("R004"),
	Chaos_R005 = FourCC("R005"),
}
