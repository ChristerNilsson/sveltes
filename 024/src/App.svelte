<script>
	import Card from './Card.svelte'
	import shuffle from 'lodash.shuffle'
	import sampleSize from 'lodash.samplesize'
	import range from 'lodash.range'

	let pairs = []
	let done = 0
	const N = 6 // pairs
	const save = (s) => {
		const arr = s.split(' ')
		pairs.push({text:arr[0], url:arr[1]})
	}

	save('Kanin https://images.unsplash.com/photo-1516632664305-eda5d6a5bb99?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1959&q=80')
	save('Häst https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1951&q=80')
	save('Numa https://lh3.googleusercontent.com/7dgSSMo4RVHaxlmwzdk2YKLPLAupb7GKp9ne0hfFh8j9hqHp_LuPtlAV32JriExiOCs1CEVDz_wwfE-wcpr-7J_Xo0nUce21-XnrL9ntAfIfhoR5e6za9g-yIa7MHFiRrg844mOvl31ppafSPXlBeQdz4JlOzcwDbYSCBOrQ9aml7CHdmgPoGrt1x8pMCuf-o_zw8D-g7LoJ6xJGhtSdAHCRe8T7vf2EhMbr1m1-JyfClwQ-ztAjVmvm4oPd4rwrbCnGbvogDksWX244uM1RuNcPx0nBg9ET272JpsEQ8ldqYbblqwbCBpw0d_KQQWswd3sKDSb4Qtuc2bGxF2SYGVgEIt6TZEN_Ud_reHjkHYKkJnE5bIipb5UJToxtc5kE_DAYn9pYye-ZdoFqyecGBX2pLEaWzkMYHwS8cpIUz1MjvOisuOmEHCGPd3nQpeeKAFj4S54cZuxxJ_9ZKGIpvj0VESro2KWANzzw6UF3O8I-kHz0WphJ12vnuu0qkm9vYkjOLB1ICDLJMZXkZLgJOpzmozEhdjsr-Ci9M01z9eWExX8mvzvHTalhC7ikoV9nRTQ81YN5kxmeJt7r2_C-OsJ9R2z33ZzfNLODte2PRDIOyU7qKWjCjHe5CHwF3_Jf9ZdQdJP__1b_7guDGpSe6raO5s5uqs7F9rtOrpDtNOoe4kPLxClV8Iyaqyc-odYn19VFeWkO9WzfuMnu119CIK_j22yxN0gAhr91XQAfYoOHhHY=w1002-h1503-no')
	save('Hund https://static2.businessinsider.de/image/5d171a3e7002b038030ea993-1400/hund%20dalmatiner%20welpe.png')
	save('Noah https://lh3.googleusercontent.com/MI0Gg5DSx2vbrae35F0On9mPPdgbZLHDmS9O0O0lUNiwymOJW1nZ_KyIkWs0bPxX84grfWyCKbC7ekxLr0-Y9iPx-ceZRCARc8U8nU8TJgHqRVgetB0nlZZBmo-M_wqE4sB5pcUl383ALpeA-MaMwE6OHvcwlLhYd_niD2ojRy-6X6yOp9WY54QTYNbK65YU0XDLtuEkhkslKWOVO4MudynnI62xe5KZ9lkL9i04sshFPamkuKQVxhBWvZpSWUip_e3Wivp6Sg18n0R0dsha_wtChrHLuKnvlUOVpLuXgbHTC9UY5uMk_5Ce-VOx7u8UEbL-2A5lVAc7lmmGdsVlMf3b7igJIAUSaALTevF5IT7KC0AjOT2OgEZvMUQbwEwhjBRjUaXygTweilrbLI-ntSjJY2itOyczSL8BAiVSKT2Tcmok1K9yG89xfjLhO_xleCzBWtDLhQ7LQWDnVUvGKyxS10BbZIZfQGrnof7RM4qn37ygSMb2LgHjhq5iCSkO0p55_UTPHwlk1XNs8LHG0jUEFKvUUYC3aOlB85crDpMmashUgu8DDujuLnyoJxW4MI4kE4f1ki7eirdGpaSDFsSLwFvcqUteV9XWffKy3LEiNsf_6b-WeZ7if4Cug-17t5_3xMeC4nvRLaGNkRvWaIwLAAAta4XJV3kMVN4pYcIALeohi81ZQ9Cd_DJifC-dL_FqcHmzb9xPH84EMLjcrLZzZHVr8mjSoCAHumlU0M7k64k=w1002-h1503-no')
	save('Anouk https://lh3.googleusercontent.com/cCliI8Ae3rUif0c04LN2WlKVlo0DufB7iiC5pBdnLt0ZxQP6xKQFMf32ECM9bMLKed9_EMm8qZBR1js9UnBUUESeFD90hI0WX1ylqNu68OHsiFemmWrdfySFbL-SKPEkWuL6F9Erry9UWPXBn7E2FZ5kHD8ZZ_rEsqLSJI-50Rmly3y_JJqrYCSnl2NmEXTl1coeBelyQN_-mZnqGw_xF6gtSSUekmvn02v-tXN-Xao2IfRnhsj0O-P7O6iVHhLReg6rLz7fg63HlHVHZG4cr7JAKzTKtk5oRa9sK1HHQJUKfluksZuRBFOvudZUozCbKZZoqauMNbUdD7AJbTQG8FiBjUlmDvRuw7ibPX6Dk4OZQiickB52Jp_H85H4J86QGea-ZOYMhJU3M5kXyBxgy0-Q7IsLL5WzX7NUIdPZh7BASvENb1-BOkriA6w73MxrO955pnPgVz-mll1YOi7aG3llfRsR8K8iVQ9Rz8Sa0U9L2baB5f6V9_drZJrCNqfvS-pkHNn_sginhlVG8IRIx5JY2yWbEBl1NlS0IgYGW3cW-7Z8OKmRq14tTu9LcjVfaM-nq_H2tDpLvZvtxOIwC1sN7HvIrB6tNO3vt9dBupJRdjse0aykLoVKOKs4o-tIkoxsp8L1Rtrnrw6a4fAStQJ6E8Vl1BCLI3Rwr1PfReY8ngqQ07JStf5A5oSHqxrXWciCw3DIlkg_7So-2JvvPnypQFmJ_5-SaTEq6lQVQbE2sVk=w1128-h1503-no')	
	save('Katt https://e.cdn-expressen.se/images/a3/35/a3351accf51f4e07b5c8823b796d49c2/1x1/320@80.jpg')
	save('Bäver https://upload.wikimedia.org/wikipedia/commons/6/6b/American_Beaver.jpg')
	save('Ånglok https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/WHR_Garratt_No143_%289103949926%29.jpg/1200px-WHR_Garratt_No143_%289103949926%29.jpg')
	save('Saffran https://passionforhalsa.se/wp-content/uploads/2015/05/Saffran-kan-bidra-till-storre-livsgladje.jpg')
	save('Pacman http://www.todayifoundout.com/wp-content/uploads/2013/08/pacman.jpg')
	save('Farfar https://lh3.googleusercontent.com/xBSgPPVoQoCVHTdoArrtQPm1mtZLUJElH6WLkZ1C12GuGhCShBAIPA87xXeHzmgms9rrWrMHtcQY-6N3sphyCxWtmtHfFPPPmNq7XVLxcO7ATzHZSU35hFnArCPhdKj3wUE3p4LSylsBMmkDXJl4ddnwZc4UNwdXVDkqpEuTa4f0XRIiWUk2mrHZR2SdnjUWozgck5FIYerSUk7lq3luWuq6wBbQkkuHC-ZSRYHve6gwACWq4a-M5JZOhPqiGgHj344NmLJ499Rpqy2-DZGzEcdusiEVwcMh_fecO15DnWfA3Mvq1OFv9PU10Ua2I34SRTfO6sSFSImzXEw1xUsrWs36gN2LY2sl2MXVUjTQ69sMKgUxRCrZX2K5i1G3xGQk8NYqnIYbwuJJqsd6MgdAF-hogl2R34AkBC4IKn68eyd98Y-An9-gvsK84iMoSCORV6Az7F0PTiEu1Y9M4x-nEzDg4j5fbJPEpB0ReesAs94mtxQFbyhc3SuI1hrEZYAOJI0zU5ufoLqmrJ8xi6STD3h2xw_fUY1UXrngpykQDRceEpChmc45ui7sH-bezJj_gM-pkUH_p7xuJMbU_s9sHicj0C8kQq1V5Ut3Gkkxjk4GHca01y3b_KRMHta89x2_537-Paa-12VmRp_W241hfkCUPH9DXfIehye7jaxNYUJ0y-4yfpIdBSdczRPQkusk5Ew4BzrqvCh98UWofiTEW6oWz0No5ouYl6vDxYpKZx44cXJxmIG9qsNBIDXFnDiZKw=s66-p-k-lf-no')
	save('Mamma https://lh3.googleusercontent.com/Swk3zn7a2fipBh30RDuYxr8IBvBT2IVJC2dEmCTicBUDz0pljO7beV2yQIZPGxxbqNMXLzUVvTZtmNg2rNY0hDmNRf-1j3jFkrFKys9DXKEF2iTYpCgSDs49L_DawCMNlMtUFl8nHLfXXlMIlTTYjhIJkMrl4wZIp50cakWbe7JCThT7bjRLNQrcCGphRQbEOaGp2x_eMGFTwNjrydo8z9Gc_EFJweZBzX3A2ScAfGGEOpiywwh9J_hNmd0xKiJWUMDOyYEhCeFvMNNdxptDRugAyKJCt8lokoVDr21dhuJUq6MR203I2Vp_b1xgSGIgWRqMzabKzJ5n7ZHvdli2SGdCo93WDKEb5dmEYTEne8CXhkpjQRhj9qBLNsi4vCFdBS9FkPDwkji9FaXpicXDgATrtva3BtFFN4NArx4YskO2RCDJ1WfaQng3fzRyFVXUxLPX3ara6C_yEL19o8qDtbN15aWsiP9wNeM6V87ssSPoz5-aklm1H_PMqCNtkV8xMNYvwNIA2xcdO0P_mkaRWkVR0NYLYJR9NMxUGaqP64jUG82aANqG3PKEnj_40y9XvOxsFidr-M2fEtJqcAfLUOQyvWjxRumgr9S5y3ka6wO2dRAQEvxkYJoQySmhp5-cSWxdGBj7BPHLN2aNhBp_7Ob3Cl3ioIB5m12wBMzqAUBFCouS4kTOPI2Et9yeh60jB8aAw5pr=s66-p-k-lf-no')
	save('Pappa https://lh3.googleusercontent.com/v66NqQpJpTr0aPLF3NOM5IvGOOlf4IwCkTkv_dvduzPd_FcTxgEATIytpWzCDsjiGwapxSQVk2yTv-qxD4EuQVL1q5pc3qyUiOnzTHyKxWIwiKtFVv6sE84_isC1Via_oWZjeYo6ieq7Z8WdTEfmvq6FMrPoj65_OTirhMu_t_rybJlOu_3gFZRD6wFVaEX0QcxquGQNey_uwG9_rTtnBh4C5mSCuaCXKI8Db5kbRWPtlDjmylGKzuxfLGc0HF1phW20LZKCLjh4KNEI9wk4He_gru-GgVRz-wXU0xJKTCsZUC7hGkANulgY-ttH5dtvpb5O9YU0XXSwr4cczvl4Vahwi7wpBrQrJTTCXUNrDK-W5-yb_7xVWk7CDMlFhwjSv7TwqS3S_Wn7mynBnBLfprjbXJ7_ImEmuWsSUWeaoloNp-bCwEHMovDA6wiDX-s2uQahRUJ_mlxHD0wCTh72TvOPYso1d5DYLu5Uab99mFfrszlCkcZN2pxcUSRV0WhfEoLByQ7PzbqI8YwRxFe9h9bX7zbs8z2DaHfugbCXHmOa0Jnzkat06KGDO5fCFCeGGjyYiDnKk2QqVaIEjBsLJPx6KM0jTXTamFAa0NqigOJFPD1ID9imouEQ4nAhSokpyysY_VKBsxcY9vFi2FrfnUTfr7stXOn8zLHodhPzzSN1zu9l6ri4WVD8uhfFtS9lKLrZU9dK=s66-p-k-lf-no')
	save('Farmor https://lh3.googleusercontent.com/N-MofXzQpbHWerImuw3OiJ7ivKXMJwICvt30SkOp2tTEy_WfwU3ELrS8yAPieUKT7Xu7Ea931Hxc5wzOySnyaV9BqPKC3WTes6fbmA9Q5E2xCi5I8XWsUKyLY3HJfX0CLbTu5WBGsnPuUxrYqHT1ut4UxxYZXePgy2b-cT3HMp-LSrncrCSQekEUU7_8Z2U26XolsfXlQJ0EAeF-YPSjpzd1RN-IDQR_uwCqrI-6pCDRMtlKi-U4TfIL-eEwDs45w7D5DAiDFteFGZ0kslS0xuexAUvsa-s4bdrd-R3pGizx_VmJPLWFwyCSNFt3Q1oHAtU4d4IO-8_OSTIkA1_9xfGwYYs2_ipEVka0fgsqgCO7XZULtgEZh5gN18C4nq16nJpyz4hoVF-D7hZLKUm91nIbgoT7TfYi6106Uh_qxZjAQdwQUfL25LFmleU4CCUgIuHCwdYK6BlfPEmcn-PCdsihnHU3_B_lyV5PaEJ90fnjeOWzr_bALXJsebTpF3XMSthdMkvsu_9gFVv1NEfF0grG5VAaMM5IbNiV71jM8vs4Tt75a9ByAsvrB4wmBsYQl-5h7LHCQv90r6_wJ2hQ4sdpCkAEKhtDBLYSiDML1N8VZshFitLnVJ7QGKd-2gUQC1hR7g6th3FhiCBp8LEYZpbIaBOAGicjJY_J_ewvG3MhHyl-hUbGlUtyxko3DlemzWxcT3Lw=s66-p-k-lf-no')
	save('Lampa https://www.temashop.se/media//catalog/product/cache/cat_resized/550/0//p/a/pac_man_lampa_gadgets_julklapp_till_bror.jpg')

	pairs = sampleSize(pairs,N)

	let cards = []
	for (const i of range(pairs.length)) {
		const pair = pairs[i]
		cards.push({marker: i+1, text:pair.text, state:0, url:pair.url})
		cards.push({marker:-i-1, text:pair.text, state:0, url:pair.url})
	}
	cards = shuffle(cards)

	let visible = []

	const click = (card) => {
		if (visible.length == 2) {
			const value = (visible[0].marker == -visible[1].marker) ? 2 : 0
			if (value==2) done += 2
			visible.pop().state = value
			visible.pop().state = value
			cards = cards
		} 
		if (card.state == 2) return
		card.state = 1
		cards = cards
		visible.push(card)
		if (done>=2*N-2 && visible.length==2) cards=[]
	}

</script>

<svg width=800 height=600>
	{#each cards as card, index}
		<Card {index} {card} {click}/>
	{/each}
</svg>
