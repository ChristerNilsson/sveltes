
const nand = (a,b) => (a==1 && b==1) ? 0 : 1
const not = (a) => nand(a,a)
const and = (a,b) => not(nand(a,b))
const or = (a,b) => nand(not(a),not(b))
const xor = (a,b) => nand(nand(nand(a,b),a),nand(nand(a,b),b))
const nor = (a,b) => not(or(a,b))

module.exports = {nand,not,and,or,xor,nor,assert}