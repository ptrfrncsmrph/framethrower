template() {
	test = template(x::Number)::Number {
		plus 100 x
	},
	w = z,
	z = plus 1 x,
	x = fetch y,
	y = state(Unit Number, 10),
	y = state(Unit Number, 100),
	test1 (test w)
}
