/* nivo - Nigeria elections. Views, state and the interactive map (hit-mask canvas + borders + LGA shapes).
   Vote numbers are seeded placeholders; swap votes()/lvt() for real data when you have it. */
import STYLE from './styles.css';
import EXTRA from './extra.css';
import SHELL from './shell.html';
import { OUTLINE, BORDERS, MASK, KEYS, BB, SO, LG } from './data/map-data';
import { LOGO, LOGO_RATIO, FAVICON } from './data/brand';

const FONTS = "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@500&family=Archivo+Narrow:wght@700&display=swap";

// export function mount(): void {
//   const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = FONTS; document.head.append(l);
//   const s = document.createElement('style'); s.textContent = STYLE; document.head.append(s);
//   document.title = 'nivo – Nigeria elections';
//   document.body.insertAdjacentHTML('afterbegin', SHELL);
//   main();
// }

const LGA_RESULTS: Record<string, [string, number, number, number, number][]> = { "Abia": [["Aba North", 190, 35898, 428, 94], ["Aba South", 215, 36717, 580, 96], ["Arochukwu", 601, 14287, 526, 33], ["Bende", 1545, 18446, 973, 79], ["Ikwuano", 407, 14995, 1065, 91], ["Isiala Ngwa North", 742, 14336, 5964, 85], ["Isiala Ngwa South", 772, 14125, 2691, 75], ["Isuikwuato", 472, 16038, 607, 78], ["Obingwa", 564, 23687, 2747, 144], ["Ohafia", 320, 8327, 432, 98], ["Osisioma", 158, 19680, 610, 57], ["Ugwunagbo", 195, 7066, 930, 34], ["Ukwa East", 264, 5819, 1200, 15], ["Ukwa West", 591, 9557, 918, 20], ["Umuahia North", 795, 51318, 1529, 112], ["Umuahia South", 475, 25017, 1156, 82], ["Umu-Nneochi", 608, 11782, 320, 46]], "Akwa Ibom": [["Abak", 15058, 5057, 7017, 123], ["Eastern Obolo", 1674, 1345, 2345, 25], ["Eket", 4675, 13238, 9757, 315], ["Esit Eket (Uquo)", 3819, 2545, 4484, 73], ["Essien Udim", 19991, 2823, 7362, 50], ["Etim Ekpo", 5182, 1711, 4733, 40], ["Etinan", 4505, 4180, 10455, 346], ["Ibeno", 878, 2403, 3227, 47], ["Ibesikpo Asutan", 6480, 3698, 9326, 345], ["Ibiono Ibom", 3407, 7752, 5274, 997], ["Ika", 5511, 1054, 3750, 35], ["Ikono", 6620, 5198, 6731, 243], ["Ikot Abasi", 2875, 4616, 6900, 153], ["Ikot Ekpene", 11803, 5985, 6624, 207], ["Ini", 3943, 2894, 7740, 76], ["Itu", 4094, 5882, 7326, 989], ["Mbo", 3204, 1456, 3922, 56], ["Mkpat Enin", 2152, 4105, 9441, 187], ["Nsit Atai", 2853, 1067, 8371, 302], ["Nsit Ibom", 5875, 2015, 8176, 128], ["Nsit Ubium", 2792, 2329, 11308, 279], ["Obot Akara", 4477, 2542, 8029, 95], ["Okobo", 3168, 2490, 5273, 172], ["Onna", 1396, 4745, 8741, 157], ["Oron", 2443, 3033, 3295, 59], ["Oruk Anam", 7039, 2617, 8962, 74], ["Udung Uko", 1555, 1068, 2701, 94], ["Ukanafun", 6152, 2067, 7751, 160], ["Uruan", 4987, 3024, 9327, 921], ["Urue Offong/Oruko", 3697, 2010, 3419, 36], ["Uyo", 7765, 27534, 12245, 1044]], "Benue": [["Ado", 2271, 9987, 1107, 67], ["Agatu", 3988, 6302, 4221, 80], ["Apa", 3430, 7421, 3682, 191], ["Buruku", 20248, 13466, 6909, 240], ["Gboko", 35149, 18615, 13901, 335], ["Guma", 10481, 21796, 999, 94], ["Gwer East", 15900, 9800, 7370, 107], ["Gwer West", 7332, 17417, 838, 91], ["Katsina-Ala", 18632, 7876, 8060, 203], ["Konshisha", 10742, 26261, 3524, 225], ["Kwande", 23027, 11945, 7813, 437], ["Logo", 8121, 13836, 9377, 152], ["Makurdi", 28692, 48228, 5134, 674], ["Obi", 4450, 7949, 4340, 87], ["Ogbadibo", 3129, 10154, 3460, 182], ["Ohimini", 3239, 6545, 4972, 64], ["Oju", 8412, 13192, 4920, 132], ["Okpokwu", 3409, 10470, 4641, 142], ["Otukpo", 8471, 23762, 6760, 332], ["Tarka", 13640, 2038, 2642, 37], ["Ukum", 20719, 8036, 9892, 161], ["Ushongo", 20060, 7324, 7264, 614], ["Vandeikya", 36926, 5952, 8255, 93]], "Ebonyi": [["Abakaliki", 3365, 36894, 974, 214], ["Afikpo North", 1405, 25480, 1155, 149], ["Afikpo South", 2386, 10895, 1227, 56], ["Ebonyi", 2677, 27551, 717, 114], ["Ezza North", 875, 17959, 392, 146], ["Ezza South", 2471, 16506, 1823, 163], ["Ikwo", 9272, 21810, 2018, 264], ["Ishielu", 1261, 16186, 574, 111], ["Ivo", 1870, 7488, 780, 38], ["Izzi", 11779, 28931, 789, 86], ["Ohaozara", 1615, 13731, 342, 81], ["Ohaukwu", 2217, 19789, 1581, 139], ["Onicha", 1215, 16518, 1131, 100]], "Kogi": [["Adavi", 10340, 897, 10612, 26], ["Ajaokuta", 12030, 3395, 8266, 629], ["Ankpa", 18976, 5918, 14170, 1559], ["Bassa", 7262, 4068, 7288, 62], ["Dekina", 22157, 1661, 10704, 164], ["Ibaji", 5992, 5933, 6219, 124], ["Idah", 9869, 2618, 5459, 69], ["Igalamela/Odolu", 9982, 2431, 4006, 84], ["Ijumu", 11237, 920, 4503, 13], ["Kabba/Bunu", 12534, 2329, 5958, 73], ["Kogi K. K.", 13472, 1040, 8825, 77], ["Lokoja", 15642, 7605, 11156, 407], ["Mopa Moro", 4935, 718, 2319, 14], ["Ofu", 16078, 1744, 6593, 187], ["Ogori Mangogo", 2008, 784, 2075, 9], ["Okehi", 9443, 1099, 11459, 36], ["Okene", 22038, 964, 6403, 34], ["Olamaboro", 10672, 7206, 5692, 304], ["Omala", 6374, 2706, 6420, 315], ["Yagba East", 10888, 954, 2711, 29], ["Yagba West", 8822, 1227, 4266, 23]], "Anambra": [["Aguata", 301, 37478, 522, 207], ["Ayamelum", 145, 17032, 405, 21], ["Anambra East", 433, 20755, 350, 75], ["Anambra West", 360, 12400, 226, 37], ["Anaocha", 178, 33695, 584, 151], ["Awka North", 118, 15561, 454, 57], ["Awka South", 305, 56498, 963, 133], ["Dunukofia", 222, 18715, 428, 52], ["Ekwusigo", 159, 21498, 362, 47], ["Idemili North", 633, 43835, 623, 195], ["Idemili-South", 587, 25994, 304, 128], ["Ihala", 27, 11571, 33, 16], ["Njikoka", 224, 31368, 479, 64], ["Nnewi North", 96, 38184, 243, 71], ["Nnewi South", 187, 16767, 201, 53], ["Ogbaru", 206, 28259, 441, 122], ["Onitsha-North", 211, 49334, 510, 140], ["Onitsha-South", 201, 38403, 287, 131], ["Orumba North", 114, 21842, 226, 117], ["Orumba South", 92, 19482, 253, 67], ["Oyi", 312, 25950, 1142, 83]], "Kaduna": [["Birnin Gwari", 17080, 235, 8774, 1143], ["Chikun", 9367, 69117, 32659, 2742], ["Giwa", 19922, 565, 22302, 3114], ["Igabi", 37259, 4839, 45962, 8276], ["Ikara", 17297, 994, 24540, 4274], ["Jaba", 3131, 9967, 8798, 335], ["Jema'a", 10928, 26560, 16452, 719], ["Kachia", 12053, 17381, 16049, 1521], ["Kaduna North", 39693, 10330, 40670, 12613], ["Kaduna South", 29596, 22577, 42996, 9124], ["Kagarko", 9698, 12502, 14027, 1255], ["Kajuru", 3940, 14875, 9253, 1221], ["Kaura", 1847, 25744, 7847, 320], ["Kauru", 15870, 11293, 19018, 3128], ["Kubau", 20139, 1701, 23686, 4819], ["Kudan", 11630, 888, 19340, 6747], ["Lere", 24695, 15568, 34149, 7264], ["Makarfi", 13767, 759, 22098, 5219], ["Sabon Gari", 25714, 12834, 30713, 6082], ["Sanga", 9393, 9088, 9233, 356], ["Soba", 18965, 354, 23364, 3722], ["Zangon Kataf", 5877, 22689, 20170, 246], ["Zaria", 41432, 3634, 62260, 8729]], "Katsina": [["Bakori", 15036, 594, 20070, 3753], ["Batagarawa", 13950, 131, 16987, 1454], ["Batsari", 7017, 21, 8889, 1096], ["Baure", 21661, 17, 16820, 592], ["Bindawa", 16578, 16, 12582, 2918], ["Charanchi", 12779, 10, 8020, 609], ["Dandume", 15062, 44, 10718, 3163], ["Danja", 16202, 44, 14004, 1920], ["Dan Musa", 11259, 1, 7294, 699], ["Daura", 16889, 78, 12913, 2368], ["Dutsi", 9258, 5, 8074, 289], ["Dutsin-Ma", 13233, 159, 17917, 3797], ["Faskari", 17180, 57, 15667, 1445], ["Funtua", 19453, 198, 18711, 3591], ["Ingawa", 12315, 47, 12152, 3388], ["Jibia", 10690, 59, 13761, 732], ["Kafur", 23517, 2285, 13167, 4448], ["Kaita", 14595, 22, 11793, 799], ["Kankara", 14456, 55, 22035, 1774], ["Kankia", 10658, 46, 17426, 700], ["Katsina", 15953, 1937, 45390, 9539], ["Kurfi", 11203, 25, 12528, 1784], ["Kusada", 7442, 6, 10990, 474], ["Mai'adua", 19098, 21, 14096, 747], ["Malufashi", 21008, 352, 19892, 7254], ["Mani", 14334, 31, 18998, 3361], ["Mashi", 12868, 38, 16085, 1107], ["Matazu", 12008, 15, 9644, 415], ["Musawa", 14360, 11, 10603, 2033], ["Rimi", 16759, 19, 15318, 1039], ["Sabuwa", 10207, 2, 7287, 409], ["Safana", 7683, 11, 7989, 943], ["Sandamu", 13681, 14, 10434, 399], ["Zango", 13891, 5, 10791, 345]], "Kebbi": [["Aliero", 6898, 71, 13619, 99], ["Arewa", 16938, 24, 17297, 267], ["Argungu", 12557, 124, 26725, 410], ["Augie", 11135, 17, 12057, 123], ["Bagudo", 18485, 33, 13142, 166], ["Birnin Kebbi", 25201, 2008, 33897, 804], ["Bunza", 8397, 19, 14047, 115], ["Dandi", 13303, 74, 13202, 130], ["Fakai", 8140, 450, 6072, 201], ["Gwandu", 11675, 9, 15212, 163], ["Jega", 13496, 154, 20381, 552], ["Kalgo", 6941, 44, 10552, 83], ["Koko/Besse", 8339, 119, 8574, 72], ["Maiyama", 11348, 8, 11637, 333], ["Ngaski", 9815, 167, 11352, 45], ["Sakaba", 7909, 936, 3731, 282], ["Shanga", 9088, 52, 9621, 23], ["Suru", 11552, 18, 12479, 161], ["Wasagu/Danko", 14505, 2092, 7560, 405], ["Yauri", 11609, 324, 13626, 258], ["Zuru", 10757, 3939, 10392, 346]], "Ondo": [["Akoko North East", 25757, 1242, 2400, 16], ["Akoko North West", 24613, 736, 5200, 8], ["Akoko South East", 10765, 470, 3016, 7], ["Akoko South West", 28367, 920, 5376, 28], ["Akure North", 14261, 2945, 4633, 66], ["Akure South", 45694, 13950, 9047, 136], ["Ese-Odo", 11160, 1709, 8200, 28], ["Idanre", 13061, 2262, 10532, 24], ["Ifedore", 15055, 954, 5360, 14], ["Ilaje", 19173, 1143, 6780, 17], ["Ileoluji/Okeigbo", 14750, 1576, 6199, 27], ["Irele", 17334, 704, 6523, 6], ["Odigbo", 27521, 3504, 7786, 243], ["Okitipupa", 26114, 1826, 12025, 19], ["Ondo East", 8390, 2004, 3912, 55], ["Ondo West", 24053, 6171, 8534, 161], ["Ose", 14376, 2031, 4767, 23], ["Owo", 29480, 3200, 5173, 52]], "Oyo": [["Afijio", 8876, 1925, 4112, 95], ["Akinyele", 20985, 6480, 6478, 127], ["Atiba", 15046, 1234, 6180, 101], ["Atisbo", 7928, 1178, 4031, 39], ["Egbeda", 22363, 6511, 5709, 110], ["Ibadan North", 28416, 13106, 8385, 524], ["Ibadan North East", 19124, 2971, 8534, 229], ["Ibadan North West", 13078, 4830, 6011, 70], ["Ibadan South-East", 20025, 2138, 7687, 87], ["Ibadan South West", 24329, 9079, 6961, 94], ["Ibarapa Central", 10291, 726, 5169, 27], ["Ibarapa East", 10575, 779, 4800, 54], ["Ibarapa North", 8088, 344, 4024, 313], ["Ido", 16505, 5161, 3570, 94], ["Irepo", 12282, 414, 3907, 24], ["Iseyin", 19731, 1371, 6588, 33], ["Itesiwaju", 6180, 387, 4948, 43], ["Iwajowa", 6284, 279, 5094, 177], ["Kajola", 11917, 503, 9358, 71], ["Lagelu", 16011, 4066, 5112, 55], ["Ogbomoso North", 14336, 7061, 5805, 124], ["Ogbomoso South", 9793, 5828, 6123, 161], ["Ogo-Oluwa", 7373, 2522, 4759, 423], ["Olorunsogo", 5178, 568, 3492, 36], ["Oluyole", 16437, 4816, 5119, 105], ["Ona-Ara", 11978, 1287, 5085, 57], ["Oorelope", 8509, 804, 3004, 143], ["Ori Ire", 12133, 1712, 6391, 39], ["Oyo East", 13430, 1870, 5091, 67], ["Oyo West", 14076, 1724, 4544, 91], ["Saki East", 6414, 1144, 3634, 144], ["Saki West", 21040, 2950, 5080, 102], ["Surulere", 11153, 3343, 8192, 236]], "Plateau": [["Barikin Ladi", 12514, 32489, 9073, 233], ["Bassa", 16007, 28226, 11306, 294], ["Bokkos", 10858, 32581, 8569, 376], ["Jos East", 6348, 6392, 5844, 156], ["Jos North", 65656, 70357, 22528, 4642], ["Jos South", 15985, 112874, 13803, 1008], ["Kanam", 41184, 4769, 24843, 237], ["Kanke", 13438, 13194, 10538, 75], ["Langtang North", 8706, 21590, 17751, 73], ["Langtang South", 7478, 6045, 12467, 24], ["Mangu", 22692, 39387, 27013, 364], ["Mikang", 6044, 7201, 7211, 62], ["Pankshin", 11019, 25450, 12225, 141], ["Qua'an Pan", 16522, 18641, 20963, 339], ["Riyom", 6936, 15171, 8181, 87], ["Shendam", 17132, 25825, 8444, 632], ["Wase", 28675, 6080, 23049, 109]], "Zamfara": [["Anka", 13467, 60, 5358, 72], ["Bakura", 34110, 17, 10824, 192], ["Birnin Magaji", 22638, 6, 6467, 43], ["Bukkuyum", 15812, 7, 9914, 290], ["Bungudu", 22013, 51, 22430, 347], ["Gummi", 22745, 24, 20702, 43], ["Gusau", 25261, 1121, 41073, 791], ["Kaura Namoda", 25301, 154, 17664, 296], ["Maradun", 21274, 0, 5829, 179], ["Maru", 12064, 12, 7776, 498], ["Shinkafi", 8692, 15, 7517, 53], ["Talata Mafara", 35384, 129, 7472, 238], ["Tsafe", 24984, 58, 17871, 884], ["Zurmi", 14651, 8, 13081, 130]], "Niger": [["Agaie", 13865, 179, 12908, 532], ["Agwara", 7659, 1628, 6046, 83], ["Bida", 22510, 2559, 13107, 571], ["Borgu", 22491, 1982, 9649, 441], ["Bosso", 19767, 6778, 14062, 1419], ["Chanchaga", 25858, 10855, 21189, 2566], ["Edatti", 10508, 93, 14779, 263], ["Gbako", 12436, 424, 11017, 170], ["Gurara", 12283, 3151, 10479, 287], ["Katcha", 10795, 180, 13268, 331], ["Kontagora", 20032, 2832, 14248, 3847], ["Lapai", 17822, 927, 13545, 381], ["Lavun", 15107, 894, 14395, 556], ["Magama", 13287, 2932, 9190, 1351], ["Mariga", 13369, 724, 6688, 603], ["Mashegu", 12665, 891, 7206, 694], ["Mokwa", 15491, 957, 15658, 697], ["Munya", 7235, 3504, 7178, 339], ["Paikoro", 18550, 5465, 13185, 1560], ["Rafi", 16963, 1058, 9581, 1523], ["Rijau", 11186, 2104, 7969, 395], ["Shiroro", 18954, 5993, 9967, 725], ["Suleja", 15917, 16978, 11968, 1645], ["Tafa", 8927, 6904, 8748, 453], ["Wushishi", 11504, 460, 8868, 404]], "Cross River": [["Abi", 8011, 3557, 5943, 24], ["Akamkpa", 4150, 7466, 3040, 59], ["Akpabuyo", 5970, 4314, 3950, 26], ["Bakassi", 306, 487, 266, 0], ["Bekwarra", 5354, 9655, 5299, 99], ["Biase", 6668, 4705, 4586, 76], ["Boki", 10274, 9753, 7800, 142], ["Calabar Municipality", 3973, 41198, 3506, 211], ["Calabar South", 9060, 24247, 4255, 146], ["Etung", 2713, 2345, 2149, 31], ["Ikom", 6111, 11626, 6003, 183], ["Obanliku", 6565, 4286, 7253, 21], ["Obubra", 9041, 4488, 7097, 43], ["Obudu", 8987, 11218, 5112, 131], ["Odukpani", 8597, 2704, 3911, 35], ["Ogoja", 9226, 10903, 10026, 149], ["Yakurr", 9646, 10198, 6600, 73], ["Yala", 15868, 16767, 8629, 195]], "Enugu": [["Aninri", 64, 11339, 395, 30], ["Awgu", 221, 19803, 445, 70], ["Enugu East", 212, 48085, 845, 203], ["Enugu North", 229, 44666, 338, 113], ["Enugu South", 194, 38511, 336, 70], ["Ezeagu", 186, 16245, 537, 106], ["Igbo Etiti", 476, 25001, 764, 108], ["Igbo Eze North", 181, 15135, 1174, 68], ["Igbo Eze South", 352, 17855, 1009, 82], ["Isi Uzo", 129, 16822, 1768, 74], ["Nkanu East", 94, 11746, 1430, 53], ["Nkanu West", 343, 15026, 550, 77], ["Nsukka", 433, 56598, 2037, 196], ["Oji-River", 280, 17793, 864, 94], ["Udenu", 327, 26633, 1157, 213], ["Udi", 611, 35408, 936, 204], ["Uzo-Uwani", 440, 11974, 1164, 47]], "Ekiti": [["Ado Ekiti", 28751, 4485, 8168, 87], ["Efon", 5873, 125, 2521, 3], ["Ekiti East", 12435, 375, 7782, 7], ["Ekiti West", 14516, 391, 4318, 10], ["Ekiti South West", 11334, 440, 5047, 9], ["Emure", 8159, 465, 3035, 14], ["Gbonyin", 11969, 245, 4178, 11], ["Ido/Osi", 11917, 782, 7476, 14], ["Ijero", 12628, 373, 5731, 6], ["Ikere", 11659, 910, 7198, 24], ["Ikole", 15465, 779, 10198, 11], ["Ilejemeje", 4599, 97, 2662, 3], ["Irepodun/Ifelodun", 14265, 544, 5516, 24], ["Ise/Orun", 11415, 497, 2734, 10], ["Moba", 12046, 246, 5847, 11], ["Oye", 14472, 643, 7143, 20]], "FCT Abuja": [["Abaji", 10370, 2874, 6888, 104], ["Bwari", 13156, 67198, 10835, 877], ["Gwagwalada", 15890, 19694, 10982, 483], ["Kuje", 10648, 14257, 10028, 266], ["Kwali", 11242, 7302, 9054, 324], ["Abuja Municipal", 29596, 170392, 26407, 2463]], "Kwara": [["Asa", 15123, 678, 10482, 116], ["Baruten", 23495, 830, 10201, 139], ["Edu", 18564, 696, 13249, 816], ["Ekiti", 5739, 721, 3760, 13], ["Ifelodun", 16369, 2517, 6457, 98], ["Ilorin East", 24264, 2409, 13325, 132], ["Ilorin-South", 21620, 7274, 10806, 166], ["Ilorin-West", 47784, 5598, 29978, 436], ["Irepodun", 11545, 3000, 6368, 113], ["Isin", 4484, 1419, 2506, 31], ["Kaiama", 14580, 435, 6073, 418], ["Moro", 15287, 959, 6429, 99], ["Offa", 19475, 1444, 3508, 71], ["Oke-Ero", 6016, 592, 3074, 16], ["Oyun", 8838, 1867, 4298, 133], ["Patigi", 10389, 727, 6395, 344]], "Nasarawa": [["Akwanga", 9221, 18227, 5955, 709], ["Awe", 14269, 4309, 10416, 576], ["Doma", 7532, 8864, 11674, 607], ["Karu", 15843, 57638, 18901, 1959], ["Keana", 7208, 4002, 4335, 236], ["Keffi", 13564, 9607, 13007, 1798], ["Kokona", 12198, 9647, 8098, 358], ["Lafia", 30796, 24935, 29917, 3321], ["Nasarawa", 17241, 8680, 10576, 1380], ["Nasarawa Eggon", 13669, 15624, 9971, 509], ["Obi", 10838, 19423, 12947, 150], ["Toto", 11553, 5228, 7077, 805], ["Wamba", 8990, 5177, 4219, 313]], "Delta": [["Aniocha North", 1146, 11678, 3783, 138], ["Aniocha-South", 1686, 14208, 4672, 113], ["Bomadi", 2421, 3134, 4429, 38], ["Burutu", 4605, 5745, 7147, 54], ["Ethiope East", 6314, 10806, 7854, 402], ["Ethiope West", 3850, 10199, 5403, 263], ["Ika North-East", 1902, 8980, 16696, 120], ["Ika-South", 3290, 17868, 7485, 166], ["Isoko North", 2734, 17765, 8254, 105], ["Isoko South", 4451, 18166, 7039, 99], ["Ndokwa East", 3758, 7756, 5996, 38], ["Ndokwa West", 3846, 12889, 8760, 56], ["Okpe", 4773, 10754, 8326, 41], ["Oshimili-North", 1688, 14929, 4796, 135], ["Oshimili-South", 894, 40085, 2790, 181], ["Patani", 2270, 2700, 3346, 43], ["Sapele", 4099, 17408, 6168, 121], ["Udu", 4937, 18579, 4836, 120], ["Ughelli North", 11196, 22589, 9241, 198], ["Ughelli South", 8877, 9790, 10244, 93], ["Ukwuani", 2946, 11239, 6713, 100], ["Uvwie", 3033, 36302, 3375, 229], ["Warri North", 1379, 2417, 3411, 52], ["Warri South", 1234, 13289, 7653, 177], ["Warri South West", 2857, 2591, 3183, 40]], "Lagos": [["Agege", 29568, 13270, 4498, 1513], ["Ajeromi/Ifelodun", 25938, 35663, 4680, 436], ["Alimosho", 62909, 71327, 8201, 701], ["Amuwo-Odofin", 13318, 55547, 2383, 330], ["Apapa", 15471, 7566, 2997, 338], ["Badagry", 31903, 10956, 6024, 153], ["Epe", 19867, 3497, 5221, 76], ["Eti-Osa", 15317, 42388, 3369, 381], ["Ibeju/Lekki", 14685, 10410, 2329, 104], ["Ifako-Ijaye", 30756, 25437, 3258, 232], ["Ikeja", 21276, 30004, 2280, 337], ["Ikorodu", 50353, 28951, 4508, 400], ["Kosofe", 36883, 46554, 4058, 902], ["Lagos Island", 27760, 3058, 2521, 79], ["Lagos Mainland", 20030, 18698, 3005, 257], ["Mushin", 41907, 23390, 3478, 410], ["Ojo", 20603, 38859, 3701, 462], ["Oshodi/Isolo", 27181, 51020, 3139, 413], ["Somolu", 27879, 28936, 3449, 476], ["Surulere", 39002, 36923, 2651, 442]], "Imo": [["Aboh Mbaise", 1197, 17604, 4181, 104], ["Ahiazu Mbaise", 970, 17332, 1833, 170], ["Ehime Mbano", 1018, 11959, 711, 58], ["Ezinihitte Mbaise", 1612, 15560, 3208, 89], ["Ideato North", 297, 10958, 586, 58], ["Ideato South", 440, 10216, 779, 65], ["Ihitte Uboma", 417, 11681, 499, 25], ["Ikeduru", 1339, 23718, 991, 111], ["Isiala Mbano", 796, 15873, 1026, 112], ["Isu", 681, 10383, 690, 29], ["Mbaitoli", 714, 21904, 674, 124], ["Ngor Okpala", 2080, 18859, 2725, 128], ["Njaba", 235, 7591, 190, 16], ["Nkwerre", 662, 7052, 319, 26], ["Nwangele", 479, 9078, 452, 13], ["Obowo", 438, 17894, 830, 7], ["Oguta", 128, 3031, 226, 4], ["Ohaji Egbema", 1954, 7500, 889, 26], ["Okigwe", 12414, 20460, 3843, 68], ["Onuimo", 349, 2905, 385, 3], ["Orlu", 274, 319, 19, 0], ["Orsu", 35, 13, 1, 0], ["Oru East", 17639, 2530, 618, 7], ["Oru West", 18644, 8383, 1530, 1], ["Owerri Municipal", 434, 26290, 821, 57], ["Owerri North", 547, 32475, 894, 122], ["Owerri West", 613, 28927, 1318, 129]], "Gombe": [["Akko", 22749, 2241, 55202, 1284], ["Balanga", 11715, 3760, 23326, 405], ["Billiri", 7232, 8898, 21911, 653], ["Dukku", 12925, 49, 21579, 899], ["Funakaye", 12672, 320, 25384, 767], ["Gombe", 19312, 2339, 62347, 3015], ["Kaltungo", 9464, 5149, 20968, 486], ["Kwami", 16245, 78, 24068, 820], ["Nafada", 8242, 7, 12339, 344], ["Shongom", 7525, 2579, 13520, 256], ["Yalmaltu/Deba", 18896, 740, 38479, 1591]], "Osun": [["Atakumosa East", 2768, 100, 9405, 7], ["Atakumosa West", 5003, 355, 7078, 4], ["Ayedaade", 13352, 397, 13251, 14], ["Ayedire", 7714, 168, 8015, 2], ["Boluwaduro", 4566, 175, 6076, 3], ["Boripe", 15325, 294, 8921, 9], ["Ede North", 9194, 782, 18908, 50], ["Ede South", 5477, 537, 16142, 19], ["Egbedore", 8536, 1469, 10432, 37], ["Ejigbo", 15209, 499, 12801, 24], ["Ife Central", 19362, 3374, 10777, 111], ["Ifedayo", 3610, 93, 5744, 3], ["Ife East", 20903, 2422, 12818, 88], ["Ifelodun", 13459, 403, 15157, 16], ["Ife North", 7915, 667, 9754, 12], ["Ife South", 9555, 554, 9765, 30], ["Ila", 9841, 230, 12334, 11], ["Ilesa East", 9580, 1358, 10089, 24], ["Ilesa West", 9803, 1651, 10841, 26], ["Irepodun", 10437, 210, 14541, 13], ["Irewole", 17991, 333, 13081, 7], ["Isokan", 9661, 172, 8774, 10], ["Iwo", 18887, 616, 15661, 12], ["Obokun", 8196, 316, 14084, 14], ["Odo-Otin", 10825, 506, 14098, 13], ["Ola-Oluwa", 7355, 142, 8134, 39], ["Olorunda", 21482, 1649, 14674, 42], ["Oriade", 11745, 677, 14982, 10], ["Orolu", 7720, 197, 8944, 13], ["Osogbo", 28474, 2937, 19085, 50]], "Sokoto": [["Binji", 9953, 15, 8646, 23], ["Bodinga", 13384, 10, 13559, 39], ["Dange/Shuni", 11954, 479, 10306, 26], ["Gada", 13631, 18, 15343, 236], ["Goronyo", 8892, 16, 11614, 21], ["Gudu", 11194, 23, 9295, 70], ["Gwadabawa", 14694, 33, 14194, 79], ["Illela", 15570, 138, 14920, 83], ["Isa", 9391, 5, 12481, 20], ["Kware", 10485, 63, 12242, 11], ["Kebbe", 9008, 1, 10430, 6], ["Rabah", 5584, 3, 5490, 48], ["S/Birni", 17994, 23, 15182, 28], ["Shagari", 11355, 3, 13009, 47], ["Silame", 7086, 5, 8240, 14], ["Sokoto North", 17228, 566, 17024, 46], ["Sokoto South", 21385, 4504, 20036, 150], ["Tambuwal", 13814, 32, 21708, 137], ["Tangaza", 10331, 25, 6594, 28], ["Tureta", 7684, 1, 8144, 9], ["Wamakko", 23189, 577, 19121, 140], ["Wurno", 10988, 19, 9832, 7], ["Yabo", 10650, 9, 11269, 32]], "Borno": [["Abadam", 2146, 0, 686, 14], ["Askira/Uba", 8109, 688, 15544, 94], ["Bama", 12579, 19, 6617, 118], ["Bayo", 8837, 26, 6078, 220], ["Biu", 13906, 606, 17872, 149], ["Chibok", 4191, 337, 8714, 27], ["Damboa", 10119, 16, 7489, 39], ["Dikwa", 11030, 8, 2773, 254], ["Gubio", 3519, 7, 2127, 30], ["Guzamala", 2668, 0, 969, 4], ["Gwoza", 9732, 396, 9674, 95], ["Hawul", 9677, 781, 16526, 46], ["Jere", 21984, 991, 19060, 801], ["Kaga", 5361, 1, 2608, 16], ["Kala Balge", 3320, 4, 912, 18], ["Konduga", 10012, 76, 4119, 111], ["Kukawa", 3983, 1, 1856, 17], ["Kwaya/Kusar", 8420, 123, 7254, 328], ["Mafa", 14821, 6, 1077, 38], ["Magumeri", 5424, 1, 3399, 32], ["Maiduguri M. C.", 42306, 2840, 36948, 1827], ["Marte", 5455, 1, 1653, 12], ["Mobbar", 3429, 0, 1649, 66], ["Monguno", 7212, 8, 2801, 39], ["Ngala", 8165, 4, 1950, 49], ["Nganzai", 3468, 1, 1513, 12], ["Shani", 12409, 264, 9053, 170]], "Taraba": [["Ardo-Kola", 6227, 6045, 13172, 421], ["Bali", 6872, 5667, 15081, 1553], ["Donga", 10953, 13611, 5582, 286], ["Gashaka", 4239, 2453, 5272, 318], ["Gassol", 13892, 5288, 25993, 2966], ["Ibi", 11876, 6507, 5089, 537], ["Jalingo", 20169, 19902, 22301, 2842], ["Karim-Lamido", 9158, 5705, 21669, 316], ["Kurmi", 3226, 5334, 6591, 73], ["Lau", 4928, 6120, 13080, 267], ["Sardauna", 17292, 5308, 15192, 1585], ["Takum", 5944, 13406, 4890, 329], ["Ussa", 6724, 18172, 4303, 304], ["Wukari", 6739, 23076, 6091, 534], ["Yorro", 3401, 5027, 9775, 327], ["Zing", 3525, 4694, 14936, 160]], "Adamawa": [["Demsa", 5746, 7962, 17166, 199], ["Fufore", 12633, 897, 26059, 508], ["Ganye", 10112, 1069, 21672, 191], ["Girei", 8531, 3749, 17557, 254], ["Gombi", 8341, 2628, 21744, 541], ["Guyuk", 5904, 8165, 13942, 91], ["Hong", 11489, 9532, 24569, 790], ["Jada", 8479, 984, 28561, 186], ["Lamurde", 3645, 9744, 9912, 188], ["Madagali", 4935, 4034, 18077, 201], ["Maiha", 7335, 440, 14088, 146], ["Mayo-Belwa", 13271, 1392, 23479, 280], ["Michika", 7062, 6047, 28328, 177], ["Mubi North", 10078, 12261, 21528, 1253], ["Mubi South", 9399, 2936, 15463, 519], ["Numan", 5115, 10229, 8984, 168], ["Shelleng", 6213, 1028, 14765, 69], ["Song", 10993, 8506, 20406, 1223], ["Toungo", 4163, 651, 7401, 59], ["Yola North", 15885, 9925, 32136, 584], ["Yola South", 13552, 3469, 31774, 379]], "Edo": [["Akoko Edo", 15183, 14002, 8660, 82], ["Egor", 3978, 40160, 1766, 298], ["Esan Central", 4458, 10192, 3692, 91], ["Esan North East", 2589, 18973, 2091, 146], ["Esan South East", 4675, 10511, 3961, 61], ["Esan West", 3417, 18793, 2630, 170], ["Etsako Central", 10008, 3707, 4691, 20], ["Etsako East", 14799, 5506, 6978, 27], ["Etsako West", 25581, 11148, 9143, 111], ["Igueben", 2419, 6449, 3530, 64], ["Ikpoba/Okha", 4367, 63639, 5931, 536], ["Oredo", 6701, 60295, 4202, 404], ["Orhionmwon", 6527, 9049, 4668, 121], ["Ovia North East", 5877, 24484, 3919, 257], ["Ovia South West", 7692, 8402, 4722, 100], ["Owan East", 13634, 6786, 9999, 31], ["Owan West", 9322, 6112, 6026, 27], ["Uhunmwode", 3244, 12955, 2976, 197]], "Jigawa": [["Auyo", 18201, 26, 13210, 2889], ["Babura", 17817, 71, 14069, 4600], ["Birnin Kudu", 22592, 98, 34792, 1912], ["Birniwa", 15150, 29, 12977, 2196], ["Buji", 11867, 9, 10868, 343], ["Dutse", 16739, 553, 29951, 2717], ["Garki", 18332, 39, 9614, 6870], ["Gagarawa", 8091, 29, 8870, 3770], ["Gumel", 6696, 78, 9816, 3935], ["Guri", 13594, 25, 6402, 5913], ["Gwaram", 19026, 127, 32907, 12010], ["Gwiwa", 16309, 2, 7643, 165], ["Hadejia", 12328, 126, 10035, 6480], ["Jahun", 24338, 32, 21683, 2133], ["Kafin Hausa", 22108, 32, 20088, 2108], ["Kaugama", 17506, 81, 14514, 4174], ["Kazaure", 9430, 119, 9827, 4040], ["Kirika Samma", 15455, 17, 12691, 2494], ["Kiyawa", 18701, 35, 17435, 756], ["Maigatari", 14640, 34, 13973, 986], ["Malam Madori", 14586, 49, 13684, 2479], ["Miga", 15293, 19, 12038, 950], ["Ringim", 18624, 57, 11213, 15630], ["Roni", 13073, 36, 8001, 622], ["Sule-Tankarkar", 14971, 24, 12919, 1500], ["Taura", 18003, 134, 11339, 6082], ["Yankwashi", 7920, 8, 6028, 480]], "Yobe": [["Bade", 8081, 215, 15789, 2983], ["Bursari", 6737, 19, 7217, 245], ["Damaturu", 7306, 769, 16649, 553], ["Fika", 12419, 227, 19975, 433], ["Fune", 12696, 49, 18308, 570], ["Geidam", 5918, 7, 7223, 805], ["Gujba", 6643, 25, 8204, 217], ["Gulani", 7995, 6, 8646, 767], ["Jakusko", 10554, 48, 11836, 2254], ["Karasawa", 9042, 33, 6048, 1775], ["Machina", 8067, 31, 3501, 797], ["Nangere", 8060, 147, 15813, 464], ["Nguru", 9588, 313, 12001, 3384], ["Potiskum", 13521, 473, 34787, 1637], ["Tarmuwa", 4416, 20, 4178, 118], ["Yunusari", 9638, 11, 3692, 836], ["Yusufari", 10778, 13, 4700, 432]], "Bauchi": [["Alkaleri", 12238, 147, 25098, 1232], ["Bauchi", 44924, 7041, 70874, 3927], ["Bogoro", 4850, 6866, 15156, 798], ["Dambam", 7588, 42, 12203, 2586], ["Darazo", 16070, 41, 17459, 1895], ["Dass", 10939, 705, 13242, 397], ["Gamawa", 13955, 53, 15469, 5127], ["Ganjuwa", 13021, 222, 17380, 4287], ["Giade", 10382, 17, 11977, 4002], ["Itas/Gadau", 11978, 36, 11757, 6315], ["Jama'are", 8140, 22, 12535, 3638], ["Katagum", 20030, 493, 22987, 9672], ["Kirfi", 9599, 33, 13431, 1544], ["Misau", 14199, 48, 18354, 4115], ["Ningi", 20587, 56, 21619, 4023], ["Shira", 14369, 54, 20683, 8555], ["Tafawa Balewa", 17897, 8776, 30585, 1281], ["Toro", 40150, 2517, 37169, 5375], ["Warji", 11862, 185, 17732, 424], ["Zaki", 13916, 19, 20897, 2910]], "Ogun": [["Abeokuta North", 20094, 4092, 5057, 104], ["Abeokuta South", 28111, 8930, 7787, 137], ["Ado Odo-Ota", 46558, 17888, 10838, 276], ["Egbado North", 19053, 1535, 9830, 478], ["Egbado South", 18471, 3126, 5012, 117], ["Ewekoro", 9778, 2287, 3646, 79], ["Ifo", 26507, 9751, 5760, 161], ["Ijebu East", 10970, 2163, 4495, 40], ["Ijebu North", 21844, 2372, 7233, 50], ["Ijebu North East", 7430, 1779, 2859, 19], ["Ijebu Ode", 16072, 3162, 4057, 56], ["Ikenne", 9431, 2698, 6616, 39], ["Imeko/Afon", 12146, 568, 4560, 32], ["Ipokia", 16929, 1860, 16082, 186], ["Obafemi/Owode", 17387, 9964, 3115, 114], ["Odeda", 12945, 3064, 3855, 73], ["Odogbolu", 12374, 2688, 6176, 36], ["Ogun Water Side", 8522, 481, 5090, 29], ["Remo North", 5814, 984, 3627, 22], ["Sagamu", 21118, 6437, 8136, 152]], "Rivers": [["Abua-Odual", 5653, 1663, 4685, 9], ["Ahoada East", 8066, 5379, 2358, 58], ["Ahoada West", 3443, 4634, 2582, 11], ["Akuku Toru", 3182, 1700, 3131, 14], ["Andoni", 3306, 2324, 4614, 18], ["Asari-Toru", 14483, 2094, 4476, 9], ["Bonny", 2708, 10488, 2406, 87], ["Degema", 2375, 2212, 3108, 44], ["Eleme", 8368, 7529, 2391, 82], ["Emohua", 9145, 4239, 5242, 18], ["Etche", 8366, 11232, 5919, 78], ["Gokana", 10122, 2215, 8484, 31], ["Ikwerre", 9609, 8752, 4869, 58], ["Khana", 7649, 1704, 5483, 47], ["Obio/Akpor", 80239, 3829, 368, 161], ["Ogba/Egbema/Ndoni", 6057, 21883, 4099, 109], ["Ogu/Bolo", 2428, 1209, 3187, 7], ["Okrika", 2729, 4018, 8476, 34], ["Omuma", 6328, 2154, 1293, 15], ["Opobo/Nkoro", 5701, 2093, 1542, 6], ["Oyigbo", 16630, 10784, 1046, 107], ["Port Harcourt", 5562, 62451, 7203, 301], ["Tai", 9442, 485, 1506, 18]], "Kano": [["Ajingi", 7066, 182, 1540, 16798], ["Albasu", 9618, 34, 2350, 19161], ["Bagwai", 14949, 102, 1935, 14243], ["Bebeji", 12616, 239, 1475, 22242], ["Bichi", 31673, 178, 1371, 20862], ["Bunkure", 11161, 76, 1528, 16759], ["Dala", 8262, 234, 8543, 55967], ["Danbata", 13179, 66, 2099, 15179], ["Dawaki Kudu", 12258, 167, 3768, 32925], ["Dawaki Tofa", 16773, 202, 2477, 25072], ["Doguwa", 15424, 642, 1408, 14543], ["Fagge", 4060, 14896, 5416, 23162], ["Gabasawa", 11992, 48, 2191, 13736], ["Garko", 8485, 313, 2067, 15889], ["Garun Malam", 8642, 160, 4409, 12249], ["Gaya", 8708, 158, 1386, 18999], ["Gezawa", 9915, 188, 2980, 21909], ["Gwale", 6950, 270, 7457, 42932], ["Gwarzo", 20627, 70, 2125, 19950], ["Kabo", 18767, 79, 2463, 15923], ["Kano Municipal", 9948, 267, 10298, 51954], ["Karaye", 10874, 134, 2132, 16295], ["Kibiya", 10283, 70, 753, 16331], ["Kiru", 19155, 112, 2467, 27199], ["Kumbotso", 6721, 815, 5996, 44474], ["Kunchi", 10359, 50, 703, 8090], ["Kura", 10929, 126, 3987, 20406], ["Madobi", 12038, 39, 2393, 23130], ["Makoda", 12590, 40, 1099, 12247], ["Minjibir", 6777, 123, 1833, 15505], ["Nasarawa", 10218, 3863, 10599, 61053], ["Rano", 11268, 115, 1898, 16286], ["Rimin Gado", 10861, 76, 907, 14634], ["Rogo", 10403, 343, 1616, 19584], ["Shanono", 11557, 44, 1703, 9672], ["Sumaila", 11341, 1106, 1553, 24307], ["Takai", 13770, 69, 3124, 19849], ["Tarauni", 6133, 659, 6067, 32891], ["Tofa", 10280, 177, 1192, 17219], ["Tsanyawa", 14052, 89, 1721, 14468], ["Tudun Wada", 18017, 1053, 1965, 23041], ["Ungogo", 8011, 334, 4659, 34916], ["Warawa", 10352, 125, 1277, 12708], ["Wudil", 10279, 380, 2785, 22517]], "Bayelsa": [["Brass", 3684, 2273, 6209, 25], ["Ekeremor", 4398, 4489, 9113, 16], ["Kolokuma/Opokuma", 4137, 3395, 8972, 34], ["Nembe", 3005, 1807, 2334, 15], ["Ogbia", 8444, 6721, 6362, 47], ["Sagbama", 4603, 4629, 10240, 24], ["Southern Ijaw", 7650, 4400, 11280, 190], ["Yenagoa", 6651, 22261, 14308, 189]] };


/* ------------------------------------------------------------------ */
/*  2015 & 2019 State results                                          */
/* ------------------------------------------------------------------ */
type StateResult = { pdp: number; apc: number; nnpp: number; lp: number; other: number; winner: string };
const STATE_RESULTS_2015: Record<string, StateResult> = {
  "Abia": { pdp: 368303, apc: 13394, nnpp: 0, lp: 0, other: 9348, winner: "pdp" },
  "Adamawa": { pdp: 251664, apc: 374701, nnpp: 0, lp: 0, other: 9653, winner: "apc" },
  "Akwa Ibom": { pdp: 953304, apc: 58411, nnpp: 0, lp: 0, other: 5349, winner: "pdp" },
  "Anambra": { pdp: 660762, apc: 17926, nnpp: 0, lp: 0, other: 9896, winner: "pdp" },
  "Bauchi": { pdp: 86085, apc: 931598, nnpp: 0, lp: 0, other: 2655, winner: "apc" },
  "Bayelsa": { pdp: 361209, apc: 5194, nnpp: 0, lp: 0, other: 664, winner: "pdp" },
  "Benue": { pdp: 303737, apc: 373961, nnpp: 0, lp: 0, other: 5566, winner: "apc" },
  "Borno": { pdp: 25640, apc: 473543, nnpp: 0, lp: 0, other: 2737, winner: "apc" },
  "Cross River": { pdp: 414863, apc: 28368, nnpp: 0, lp: 0, other: 7283, winner: "pdp" },
  "Delta": { pdp: 1211405, apc: 48910, nnpp: 0, lp: 0, other: 7458, winner: "pdp" },
  "Ebonyi": { pdp: 323653, apc: 19518, nnpp: 0, lp: 0, other: 20717, winner: "pdp" },
  "Edo": { pdp: 286869, apc: 208469, nnpp: 0, lp: 0, other: 5113, winner: "pdp" },
  "Ekiti": { pdp: 176466, apc: 120331, nnpp: 0, lp: 0, other: 3894, winner: "pdp" },
  "Enugu": { pdp: 553003, apc: 14157, nnpp: 0, lp: 0, other: 6013, winner: "pdp" },
  "FCT Abuja": { pdp: 157195, apc: 146399, nnpp: 0, lp: 0, other: 3211, winner: "pdp" },
  "Gombe": { pdp: 96873, apc: 361245, nnpp: 0, lp: 0, other: 2481, winner: "apc" },
  "Imo": { pdp: 559185, apc: 133253, nnpp: 0, lp: 0, other: 10526, winner: "pdp" },
  "Jigawa": { pdp: 142904, apc: 885988, nnpp: 0, lp: 0, other: 8672, winner: "apc" },
  "Kaduna": { pdp: 484085, apc: 1127760, nnpp: 0, lp: 0, other: 5637, winner: "apc" },
  "Kano": { pdp: 215779, apc: 1903999, nnpp: 0, lp: 0, other: 9043, winner: "apc" },
  "Katsina": { pdp: 98937, apc: 1345441, nnpp: 0, lp: 0, other: 5048, winner: "apc" },
  "Kebbi": { pdp: 100972, apc: 567883, nnpp: 0, lp: 0, other: 8148, winner: "apc" },
  "Kogi": { pdp: 149987, apc: 264851, nnpp: 0, lp: 0, other: 6490, winner: "apc" },
  "Kwara": { pdp: 132602, apc: 302146, nnpp: 0, lp: 0, other: 5332, winner: "apc" },
  "Lagos": { pdp: 632327, apc: 792460, nnpp: 0, lp: 0, other: 18899, winner: "apc" },
  "Nasarawa": { pdp: 273460, apc: 236838, nnpp: 0, lp: 0, other: 1249, winner: "pdp" },
  "Niger": { pdp: 149222, apc: 657678, nnpp: 0, lp: 0, other: 6771, winner: "apc" },
  "Ogun": { pdp: 207950, apc: 308290, nnpp: 0, lp: 0, other: 16932, winner: "apc" },
  "Ondo": { pdp: 251368, apc: 299889, nnpp: 0, lp: 0, other: 9799, winner: "apc" },
  "Osun": { pdp: 249929, apc: 383603, nnpp: 0, lp: 0, other: 9083, winner: "apc" },
  "Oyo": { pdp: 303376, apc: 528620, nnpp: 0, lp: 0, other: 49356, winner: "apc" },
  "Plateau": { pdp: 549615, apc: 429140, nnpp: 0, lp: 0, other: 3633, winner: "pdp" },
  "Rivers": { pdp: 1487075, apc: 69238, nnpp: 0, lp: 0, other: 9148, winner: "pdp" },
  "Sokoto": { pdp: 152199, apc: 671926, nnpp: 0, lp: 0, other: 10134, winner: "apc" },
  "Taraba": { pdp: 310800, apc: 261326, nnpp: 0, lp: 0, other: 7551, winner: "pdp" },
  "Yobe": { pdp: 25526, apc: 446265, nnpp: 0, lp: 0, other: 2005, winner: "apc" },
  "Zamfara": { pdp: 144833, apc: 612202, nnpp: 0, lp: 0, other: 3987, winner: "apc" },
};

const STATE_RESULTS_2019: Record<string, StateResult> = {
  "Abia": { pdp: 219698, apc: 85058, nnpp: 0, lp: 0, other: 18535, winner: "pdp" },
  "Adamawa": { pdp: 410266, apc: 378078, nnpp: 0, lp: 0, other: 23190, winner: "pdp" },
  "Akwa Ibom": { pdp: 395832, apc: 175429, nnpp: 0, lp: 0, other: 7514, winner: "pdp" },
  "Anambra": { pdp: 524738, apc: 33298, nnpp: 0, lp: 0, other: 47698, winner: "pdp" },
  "Bauchi": { pdp: 209313, apc: 798428, nnpp: 0, lp: 0, other: 16566, winner: "apc" },
  "Bayelsa": { pdp: 197933, apc: 118821, nnpp: 0, lp: 0, other: 5013, winner: "pdp" },
  "Benue": { pdp: 356817, apc: 347668, nnpp: 0, lp: 0, other: 24427, winner: "pdp" },
  "Borno": { pdp: 71788, apc: 836496, nnpp: 0, lp: 0, other: 11502, winner: "apc" },
  "Cross River": { pdp: 295737, apc: 117302, nnpp: 0, lp: 0, other: 8862, winner: "pdp" },
  "Delta": { pdp: 594068, apc: 221292, nnpp: 0, lp: 0, other: 14402, winner: "pdp" },
  "Ebonyi": { pdp: 258573, apc: 90726, nnpp: 0, lp: 0, other: 9832, winner: "pdp" },
  "Edo": { pdp: 275691, apc: 267842, nnpp: 0, lp: 0, other: 17178, winner: "pdp" },
  "Ekiti": { pdp: 154032, apc: 219231, nnpp: 0, lp: 0, other: 7869, winner: "apc" },
  "Enugu": { pdp: 355553, apc: 54423, nnpp: 0, lp: 0, other: 11038, winner: "pdp" },
  "FCT Abuja": { pdp: 259997, apc: 152224, nnpp: 0, lp: 0, other: 11730, winner: "pdp" },
  "Gombe": { pdp: 138484, apc: 402961, nnpp: 0, lp: 0, other: 12758, winner: "apc" },
  "Imo": { pdp: 334923, apc: 140463, nnpp: 0, lp: 0, other: 36200, winner: "pdp" },
  "Jigawa": { pdp: 289895, apc: 794738, nnpp: 0, lp: 0, other: 21611, winner: "apc" },
  "Kaduna": { pdp: 649612, apc: 993445, nnpp: 0, lp: 0, other: 20546, winner: "apc" },
  "Kano": { pdp: 391593, apc: 1464768, nnpp: 0, lp: 0, other: 34773, winner: "apc" },
  "Katsina": { pdp: 308056, apc: 1232133, nnpp: 0, lp: 0, other: 15284, winner: "apc" },
  "Kebbi": { pdp: 154282, apc: 581552, nnpp: 0, lp: 0, other: 20771, winner: "apc" },
  "Kogi": { pdp: 218207, apc: 285894, nnpp: 0, lp: 0, other: 16915, winner: "apc" },
  "Kwara": { pdp: 138184, apc: 308984, nnpp: 0, lp: 0, other: 12508, winner: "apc" },
  "Lagos": { pdp: 448015, apc: 580825, nnpp: 0, lp: 0, other: 60727, winner: "apc" },
  "Nasarawa": { pdp: 283847, apc: 289903, nnpp: 0, lp: 0, other: 7028, winner: "apc" },
  "Niger": { pdp: 218052, apc: 612371, nnpp: 0, lp: 0, other: 21514, winner: "apc" },
  "Ogun": { pdp: 194655, apc: 281762, nnpp: 0, lp: 0, other: 87839, winner: "apc" },
  "Ondo": { pdp: 275901, apc: 241769, nnpp: 0, lp: 0, other: 38324, winner: "pdp" },
  "Osun": { pdp: 337377, apc: 347634, nnpp: 0, lp: 0, other: 29671, winner: "apc" },
  "Oyo": { pdp: 366690, apc: 365229, nnpp: 0, lp: 0, other: 104612, winner: "pdp" },
  "Plateau": { pdp: 548665, apc: 468555, nnpp: 0, lp: 0, other: 17633, winner: "pdp" },
  "Rivers": { pdp: 473971, apc: 150710, nnpp: 0, lp: 0, other: 17484, winner: "pdp" },
  "Sokoto": { pdp: 361604, apc: 490333, nnpp: 0, lp: 0, other: 19954, winner: "apc" },
  "Taraba": { pdp: 374743, apc: 324906, nnpp: 0, lp: 0, other: 13228, winner: "pdp" },
  "Yobe": { pdp: 50763, apc: 497914, nnpp: 0, lp: 0, other: 10688, winner: "apc" },
  "Zamfara": { pdp: 125423, apc: 438682, nnpp: 0, lp: 0, other: 14334, winner: "apc" },
};


export function mount(): void {
  // theme first, so there is no flash of the wrong palette
  let th = ''; try { th = localStorage.getItem('nivo-theme') || '' } catch { }
  document.documentElement.dataset.theme = th || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = FONTS; document.head.append(l);
  for (const css of [STYLE, EXTRA]) { const s = document.createElement('style'); s.textContent = css; document.head.append(s) }

  // favicon (5.png)
  document.querySelectorAll('link[rel~="icon"]').forEach(e => e.remove());
  const fav = document.createElement('link'); fav.rel = 'icon'; fav.type = 'image/png'; fav.href = FAVICON; document.head.append(fav);
  document.title = 'nivo – For Nigerian Voters';

  document.body.insertAdjacentHTML('afterbegin', SHELL);

  // logo (weace.png) – fills the existing logo slot if the shell has one, otherwise goes at the start of the header
  const img = `<img class="brand-logo" src="${LOGO}" width="${Math.round(28 * LOGO_RATIO)}" height="28" alt="nivo">`;
  const slot = document.querySelector('#logo, .logo, [data-logo], .brand');
  if (slot) slot.innerHTML = img;
  else (document.querySelector('header') || document.body).insertAdjacentHTML('afterbegin', img);

  main();
}

/* ===== 02-tail.ts =====
   REPLACE everything from the line `// Map short state name → full name used by the map` to the END of your file with this block. */

// ---------- name normalisation (so "FCT Abuja" / "Nasarawa" / "X State" always match the map keys) ----------
const norm = (s: string) => s.toLowerCase().replace(/\bstate\b/g, '').trim()
  .replace(/^(federal capital territory|fct)$/, 'fct abuja').replace(/nassarawa/, 'nasarawa').replace(/[^a-z]/g, '');
const STATE_KEY: Record<string, string> = {};
for (const full of Object.keys(LG)) STATE_KEY[norm(full)] = full;
const fullName = (s: string) => STATE_KEY[norm(s)] ?? s;

// 2023 LGA lookup: fullState → lgaName → [APC, PDP, LP, NNPP]
const LGA_2023: Record<string, Record<string, number[]>> = {};
const STATE_2023: Record<string, number[]> = {};
for (const [short, rows] of Object.entries(LGA_RESULTS)) {
  const full = STATE_KEY[norm(short)] ?? (short + ' State');
  LGA_2023[full] = {};
  const tot = [0, 0, 0, 0];
  for (const [name, apc, lp, pdp, nnpp] of rows) {
    LGA_2023[full][name] = [apc, pdp, lp, nnpp];
    tot[0] += apc; tot[1] += pdp; tot[2] += lp; tot[3] += nnpp;
  }
  STATE_2023[full] = tot;
}

// 2015 / 2019 state tables → [APC, PDP, Others]  (only the two main parties were major; everything else is "Others")
const YEAR_STATE: Record<string, Record<string, number[]>> = { '2019': {}, '2015': {} };
for (const [y, src] of [['2019', STATE_RESULTS_2019], ['2015', STATE_RESULTS_2015]] as [string, Record<string, StateResult>][])
  for (const [s, r] of Object.entries(src)) YEAR_STATE[y][fullName(s)] = [r.apc, r.pdp, r.other];

// National totals
const NAT_2023 = [8794726, 6984520, 6101533, 1496687]; // APC PDP LP NNPP (official)
const natFor = (y: string): number[] => y === '2023' ? NAT_2023.slice()
  : Object.values(YEAR_STATE[y]).reduce((a, v) => a.map((x, i) => x + v[i]), [0, 0, 0]);

// Who won each unit (computed AFTER the tables above are filled – the old version ran too early and returned zeros)
const winsOf = (rows: number[][], n: number) => {
  const w = new Array(n).fill(0);
  for (const v of rows) { let b = 0; for (let i = 1; i < n; i++) if (v[i] > v[b]) b = i; if (v[b] > 0) w[b]++ }
  return w;
};
const LG_WINS_2023 = winsOf(Object.values(LGA_2023).flatMap(s => Object.values(s)), 4);

function main(): void {
  /* ---------- parties & candidates differ per election ---------- */
  const PTY: Record<string, any> = {
    APC: { k: 'APC', n: 'All Progressives Congress', fill: 'var(--blu500)', edge: 'var(--blu600)', tint: 'var(--blu50)', ink: 'var(--blu600)' },
    PDP: { k: 'PDP', n: 'Peoples Democratic Party', fill: 'var(--red500)', edge: 'var(--red600)', tint: 'var(--red50)', ink: 'var(--red600)' },
    LP: { k: 'LP', n: 'Labour Party', fill: 'var(--grn500)', edge: 'var(--grn600)', tint: 'var(--grn50)', ink: 'var(--grn800)' },
    NNPP: { k: 'NNPP', n: 'New Nigeria People’s Party', fill: 'var(--pur400)', edge: 'var(--pur500)', tint: 'var(--g50)', ink: 'var(--g800)' },
    OTH: { k: 'Others', n: 'All other parties', fill: '#9a9a9a', edge: '#7d7d7d', tint: 'var(--g50)', ink: 'var(--g800)', w: 'Other candidates', wiki: '' },
  };
  const mk = (k: string, w: string, wiki: string) => ({ ...PTY[k], w, wiki });
  const YP: Record<string, any[]> = {
    '2023': [mk('APC', 'Bola Ahmed Tinubu', 'Bola_Tinubu'), mk('PDP', 'Abubakar Atiku', 'Atiku_Abubakar'), mk('LP', 'Peter Gregory Obi', 'Peter_Obi'), mk('NNPP', 'Musa Mohammed Rabiu Kwankwaso', 'Rabiu_Kwankwaso')],
    '2019': [mk('APC', 'Muhammadu Buhari', 'Muhammadu_Buhari'), mk('PDP', 'Atiku Abubakar', 'Atiku_Abubakar'), PTY.OTH],
    '2015': [mk('APC', 'Muhammadu Buhari', 'Muhammadu_Buhari'), mk('PDP', 'Goodluck Jonathan', 'Goodluck_Jonathan'), PTY.OTH],
  };
  const YEARS = ['2023', '2019', '2015'];
  let P = YP['2023'];
  const col = (i: number) => P[i].fill;

  const GEO: Record<string, string[]> = Object.fromEntries(Object.keys(LG).sort().map(k => [k, LG[k].map(x => x[0])]));
  const LGAS: { n: string; s: string }[] = Object.entries(GEO).flatMap(([s, l]) => l.map(n => ({ n, s })));
  const STATES: { n: string; s: string }[] = Object.keys(GEO).map(s => ({ n: s.replace(/ State$/, ''), s }));
  const S = { y: '2023', st: '', lga: '', srch: 0, view: 'nat', all: 0, z: 1, px: 0, py: 0, c1: '', c2: '' };
  const hasLga = () => S.y === '2023';                       // LGA data exists for 2023 only
  const UNITS = () => hasLga() ? LGAS : STATES;              // what the compare/insights/search views work on
  const mob = matchMedia('(max-width:600px)'), mob900 = matchMedia('(max-width:900px)');
  const $ = (s: string): any => document.querySelector(s), fmt = (n: number) => Math.round(n).toLocaleString('en-US'), RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDark = () => document.documentElement.dataset.theme === 'dark';

  function votes(name: string, _big?: boolean | number): number[] {
    if (name === 'nat' || name === 'National') return natFor(S.y);
    const m = S.y === '2023' ? STATE_2023 : YEAR_STATE[S.y];
    return (m[fullName(name)] ?? P.map(() => 0)).slice();
  }
  const lvt = (lga: string, state: string, _extra = ''): number[] =>
    hasLga() ? (LGA_2023[fullName(state)]?.[lga] ?? [0, 0, 0, 0]).slice() : P.map(() => 0);
  const uv = (u: { n: string; s: string }) => hasLga() ? lvt(u.n, u.s) : votes(u.s);   // votes for one unit (LGA or state)
  const stateWins = () => winsOf(Object.values(S.y === '2023' ? STATE_2023 : YEAR_STATE[S.y]), P.length);
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0), rank = (v: number[]) => v.map((x, i) => [x, i]).sort((a, b) => b[0] - a[0]);
  const setYear = (y: string) => {
    const was = hasLga(); S.y = y; P = YP[y];
    if (!hasLga()) S.lga = '';
    if (was !== hasLga()) { S.c1 = S.c2 = ''; S.srch = 0 }      // compare picks are different kinds of unit now
  };

  const sel = (id: string, o: (string | string[])[], val: string, cls = '', ph?: string) => `<select class="sel ${cls}" id="${id}" aria-label="${ph || id}">${ph ? `<option value="" disabled ${val ? '' : 'selected'}>${ph}</option>` : ''}${o.map(x => { const [v, l] = Array.isArray(x) ? x : [x, x]; return `<option value="${v}"${v === val ? ' selected' : ''}>${l}</option>` }).join('')}</select>`;
  const I: Record<string, string> = { fit: '<path d="M4 8V4h4M16 8V4h-4M4 12v4h4M16 12v4h-4"/>', left: '<path d="m12 5-5 5 5 5"/>', x: '<circle cx="10" cy="10" r="8" fill="#919191" stroke="none"/><path d="m7.5 7.5 5 5m0-5-5 5" stroke="#e4e4e4"/>', sel: '<path d="M6.5 8 10 4.5 13.5 8M6.5 12l3.5 3.5 3.5-3.5"/>', right: '<path d="m8 5 5 5-5 5"/>', add: '<path d="M10 4v12M4 10h12"/>', rem: '<path d="M4 10h12"/>', search: '<circle cx="9" cy="9" r="5"/><path d="m13 13 4 4"/>', back: '<path d="M16 10H4m5-5-5 5 5 5"/>', down: '<path d="m5 8 5 5 5-5"/>' };
  const ic = (k: string, s = 20, c = '#767676') => `<svg width="${s}" height="${s}" viewBox="0 0 20 20" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[k]}</svg>`;
  const layers = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" aria-hidden="true"><path d="m8 2 6 3-6 3-6-3zM2 8l6 3 6-3M2 11l6 3 6-3"/></svg>`;

  async function loadElectionNews() {
    const feed = $('#news-feed');
    if (!feed) return;

    try {
      // Uses a free proxy to bypass CORS and convert OnyeAkụkọ's RSS feed to JSON
      const rssUrl = encodeURIComponent('https://onyeakuko.online/');
      const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`);

      if (!res.ok) throw new Error('API unreachable');

      const data = await res.json();
      if (data.status !== 'ok') throw new Error('Feed failed');

      // Strict filter: ONLY show articles mentioning these election keywords
      const electionKeywords = ['election', '2027', 'inec', 'obi', 'tinubu', 'atiku', 'adc', 'apc', 'campaign', 'poll', 'ballot', 'candidate'];
      const electionNews = (data.items || []).filter((article: any) => {
        const text = (article.title + " " + (article.description || "")).toLowerCase();
        return electionKeywords.some(keyword => text.includes(keyword));
      }).slice(0, 5); // Limit to top 5 stories

      if (electionNews.length === 0) {
        feed.innerHTML = `<p class="sm sub" style="padding: 12px 0;">No new election updates at the moment.</p>`;
        return;
      }

      // Map into your existing UI list styling
      feed.innerHTML = electionNews.map((n: any) => `
        <a href="${n.link}" target="_blank" class="cl" style="--c:var(--blu500); text-decoration:none; align-items:flex-start; cursor:pointer;">
          <div class="fl">
            <p class="md" style="color:var(--g900); margin-bottom: 4px; transition: color 0.2s;">${n.title}</p>
            <p class="xs sub">${new Date(n.pubDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })} · OnyeAkụkọ</p>
          </div>
        </a>
      `).join('');

    } catch (e) {
      feed.innerHTML = `<div class="note sm" style="margin-top:12px;">${layers}<p>Could not load live news. <a href="https://onyeakuko.online" target="_blank" style="color:inherit; text-decoration:underline;">Check OnyeAkụkọ directly</a>.</p></div>`;
    }
  }

  /* ---------- candidate photos (Wikipedia thumbnail, cached, falls back to initials) ---------- */
  const IMG: Record<string, string> = {}; try { Object.assign(IMG, JSON.parse(localStorage.getItem('nivo-img') || '{}')) } catch { }
  const pend: Record<string, Promise<void>> = {};
  const loadImg = (w: string): Promise<void> => IMG[w] ? Promise.resolve() : (pend[w] ??= fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${w}`)
    .then(r => r.json()).then(j => { const u = j?.thumbnail?.source; if (u) { IMG[w] = u; try { localStorage.setItem('nivo-img', JSON.stringify(IMG)) } catch { } } }).catch(() => { }));
  const initials = (w: string) => { const a = w.split(' ').filter(Boolean); return (a[0]?.[0] || '') + (a.length > 1 ? a[a.length - 1][0] : '') };
  function avatars(root: ParentNode) {
    root.querySelectorAll<HTMLElement>('.av[data-wiki]').forEach(a => {
      const w = a.dataset.wiki!; if (!w) return;
      const apply = () => { if (IMG[w]) { a.style.backgroundImage = `url("${IMG[w]}")`; a.classList.add('ph-on') } };
      apply(); if (!IMG[w]) loadImg(w).then(apply);
    });
  }

  const candRow = (i: number, v: number, t: number, pp?: number) => `<div class="cell"><i class="dot" style="width:10px;height:10px;background:${col(i)}"></i><span class="av" data-wiki="${P[i].wiki || ''}">${initials(P[i].w)}</span><div class="fl"><p class="md ell">${P[i].w}</p><p class="xs sub">${P[i].n}</p></div><div class="rt"><p class="md">${(pp ?? v / (t || 1) * 100).toFixed(2)}%</p><p class="xs sub">${fmt(v)} votes</p></div></div>`;
  const legend = () => `<div class="leg">${P.map(p => `<span class="xs"><i style="background:${p.fill};border-color:${p.edge}"></i>${p.k}</span>`).join('')}</div>`;
  const note = (txt: string, cls = '') => `<div class="note sm ${cls}">${layers}<p>${txt}</p></div>`;

  /* animation */
  function run(root: any) {
    root.querySelectorAll('[data-h],[data-w]').forEach((e: any) => { const h = e.dataset.h, w = e.dataset.w; if (RM) { h && (e.style.height = h); w && (e.style.width = w); return } requestAnimationFrame(() => requestAnimationFrame(() => { h && (e.style.height = h); w && (e.style.width = w) })) });
    root.querySelectorAll('[data-n]').forEach((e: any) => { const to = +e.dataset.n, d = +(e.dataset.d || 0), sf = e.dataset.s || '', cm = e.dataset.c, f = (x: number) => (cm ? fmt(x) : x.toFixed(d)) + sf; if (RM) { e.textContent = f(to); return } const t0 = performance.now(); (function s(t: number) { const k = Math.min(1, (t - t0) / 900), x = to * (1 - Math.pow(1 - k, 3)); e.textContent = f(x); k < 1 && requestAnimationFrame(s) })(t0) });
    avatars(root);
  }

  /* views */
  const V: Record<string, () => string> = {};
  V.map = () => `<section class="mapv${hasLga() ? '' : ' nolga'}"><div class="mp" id="mp"><div class="zw" id="zw"><div class="mb" id="mb" role="group" aria-label="Map of Nigeria"><canvas id="mcv" width="736" height="654"></canvas><svg class="bd" viewBox="0 0 736 654" aria-hidden="true"><path class="b1" d="${BORDERS}"/><path class="b0" d="${OUTLINE}"/></svg><svg id="lgasvg" viewBox="0 0 736 654"></svg></div></div><button class="allst" id="allst" aria-label="Show the full map" title="Show the full map">${ic('fit', 18, '#181818')}Full map</button><div class="tip" id="tip"></div><div class="zoom"><button data-z="1" aria-label="Zoom in">${ic('add')}</button><hr><button data-z="-1" aria-label="Zoom out">${ic('rem')}</button></div></div><aside class="rp"><div id="bkbar"></div><div id="ph"></div><div class="row ctl" id="ctl"><div class="seg" id="seg"><button class="bk" id="bk" aria-label="Exit search">${ic('left')}</button><select class="sel s" id="st" aria-label="State"></select><select class="sel s" id="lga" aria-label="Local Government Area"></select></div><label class="sbx" id="sbx"><button class="sb1" id="sbtn" aria-label="Search">${ic('search')}</button><input id="q" autocomplete="off" aria-label="Search"><button class="qx" id="qx" aria-label="Clear search">${ic('x', 16)}</button></label></div><div id="pb"></div></aside></section>`;

  function tip(x?: number, y?: number) {
    const t = $('#tip'); if (!t) return; if (x == null) sync();
    const h: Hov = HOV || (mob900.matches && S.lga && hasLga() ? { k: S.lga, st: false, s: S.st } : null);
    if (!h) { t.style.display = 'none'; return }
    t.style.display = 'block'; t.classList.toggle('dock', mob900.matches);
    const nm = h.st ? h.k.replace(' State', '') : h.k, v = h.st ? votes(h.k, true) : lvt(h.k, h.s), [a, b] = rank(v), tot = a[0] + b[0];
    t.innerHTML = tot ? `<h4 class="md ell">${nm}</h4><p class="xs sub" style="padding:4px 16px 8px">${P[a[1]].k} <span style="color:var(--grn500)">+${((a[0] - b[0]) / tot * 100).toFixed(1)} pp</span> ahead of ${P[b[1]].k}</p><div class="tt xsb sub"><span class="c1">Party</span><span class="c2">Margin</span><span class="c3">Votes</span></div><hr>${[a, b].map((r, k) => `<div class="tt sm" style="${k ? '' : `background:${col(r[1])};color:#fff;`}"><span class="c1 row" style="gap:6px"><i class="dot" style="background:${k ? col(r[1]) : '#fff'}"></i>${P[r[1]].k}</span><span class="c2">${(r[0] / tot * 100).toFixed(2)}%</span><span class="c3">${fmt(r[0])}</span></div>`).join('')}`
      : `<h4 class="md ell">${nm}</h4><p class="xs sub" style="padding:4px 16px 12px">No result data for this area</p>`;
    if (mob900.matches) { t.style.left = ''; t.style.top = '' } else if (x != null && y != null) { const m = $('#mp').getBoundingClientRect(); t.style.left = Math.max(12, Math.min(m.width - 354, x - m.left + 16)) + 'px'; t.style.top = Math.max(12, Math.min(m.height - 170, y - m.top + 16)) + 'px' } else { t.style.display = 'none' }
  }
  function hdr() {
    $('#bkbar').innerHTML = S.view === 'nat' ? '' : `<div class="in"><button class="back sm" id="back">${ic('back', 20, '#adadad')}Go back</button></div>`;
    $('#ph').innerHTML = S.view === 'nat'
      ? `<div class="in"><h2 class="t20">${S.y} General Elections</h2>${legend()}</div>`
      : `<div class="in"><h2 class="ttl" style="margin-top:8px">${S.st.replace(' State', '')}</h2><p class="r14 sub" style="margin-top:12px">${fmt(sum(votes(S.st, 1)))} total votes · ${S.y}</p></div><div class="in">${legend()}</div>`;
    $('#back')?.addEventListener('click', reset);
  }
  function ctl() {
    const g = $('#seg'), st = $('#st'), lg = $('#lga'), L = hasLga();
    g.classList.toggle('has', !!S.st && L); g.classList.toggle('srch', !!S.srch); g.classList.toggle('nolga', !L); $('#sbx').classList.toggle('srch', !!S.srch);
    st.innerHTML = `<option value="" disabled ${S.st ? '' : 'selected'}>Choose a state</option>` + Object.keys(GEO).map(x => `<option${x === S.st ? ' selected' : ''}>${x}</option>`).join('');
    lg.innerHTML = `<option value="" disabled ${S.lga ? '' : 'selected'}>Choose LGA</option>` + (GEO[S.st] || []).map(x => `<option${x === S.lga ? ' selected' : ''}>${x}</option>`).join('');
    st.classList.toggle('act', !S.st || !L); lg.classList.toggle('act', !!S.st && L);
    $('#q').placeholder = L ? 'Search for a Local Government Area' : 'Search for a state';
  }
  function body() {
    const r = $('#pb');
    if (S.srch) {
      const q = $('#q').value.trim().toLowerCase(), L = hasLga(), m = UNITS().filter(x => (x.n + ' ' + x.s).toLowerCase().includes(q));
      r.innerHTML = `<div class="in" style="margin-top:12px"><p class="xs sub">${m.length} ${L ? 'Local Government Areas' : 'states'}</p></div>` + (m.slice(0, 150).map(x => `<button class="cell res" data-s="${x.s}" data-l="${L ? x.n : ''}"><div class="fl"><p class="md">${x.n}</p><p class="xs sub">${L ? x.s : 'State'}</p></div>${ic('right')}</button>`).join('') || `<p class="in r14 sub">No match for “${$('#q').value}”</p>`);
      r.querySelectorAll('.res').forEach((b: any) => b.onclick = () => pick(b.dataset.s, b.dataset.l)); return
    }
    if (S.view === 'nat') {
      const natVotes = votes('nat'), t = sum(natVotes);
      r.innerHTML = `<hr class="hr"><div style="margin-top:var(--s24)"><div class="in"><h3 class="t18">Presidency</h3><p class="r14 sub" style="margin-top:4px">${fmt(t)} total votes</p></div>${rank(natVotes).map(([v, i]) => candRow(i, v, t)).join('')}</div><hr class="hr">${hasLga() ? '' : note(`LGA-level results are not available for ${S.y}. Click any state on the map to see its result.`, 'lvl-note')}`;
    } else {
      const L = GEO[S.st], v = votes(S.st, 1), t = sum(v) || 1, o = rank(v), few = P.length <= 3, vis = S.all || few ? o : o.slice(0, 2);
      const lgaTable = hasLga() ? `<hr class="hr" style="margin:16px 0"><div class="row md" style="padding:8px 12px;gap:4px">Local Governments<span class="sub">(${L.length})</span></div><div class="tbl th"><span style="flex:1">LGA</span><span style="width:var(--c1w)">Ruling Party</span><span style="width:var(--c2w)">Vote %</span><span style="width:var(--c3w)"></span></div><hr class="hr">${L.map(n => { const lv = lvt(n, S.st), lt = sum(lv) || 1, [w, i] = rank(lv)[0]; return `<div class="tbl sm lr${n === S.lga ? ' on' : ''}" data-l="${n}" style="padding:0 4px;border-bottom:1px solid var(--g100)"><span style="flex:1;align-self:center">${n}</span><span class="row" style="width:var(--c1w);gap:12px"><i class="dot" style="background:${col(i)}"></i><span><span style="display:block">${P[i].k}</span><span class="xs sub">${P[i].w.split(' ').slice(-1)[0]}</span></span></span><span style="width:var(--c2w);background:${P[i].tint};color:${P[i].ink}">${(w / lt * 100).toFixed(2)}%<span class="xs" style="display:block">${fmt(w)} votes</span></span><span style="width:var(--c3w);align-self:center">${ic('right')}</span></div>` }).join('')}` : note(`LGA-level results are not available for ${S.y}; only state results are shown. LGA data exists for 2023.`, 'lvl-note');
      r.innerHTML = `<div class="in" style="padding-top:0"><div class="stk">${o.map(([x, i]) => `<div class="grow" data-w="${x / t * 100}%" style="width:0;background:${col(i)}"></div>`).join('')}</div></div><div style="margin-top:16px">${vis.map(([x, i]) => candRow(i, x, t)).join('')}${few ? '' : `<div class="in"><button class="more sm" id="more">${S.all ? 'Fewer results' : 'More results'}${ic('down')}</button></div>`}</div>${lgaTable}`;
      r.querySelectorAll('.lr').forEach((e: any) => e.onclick = () => { S.lga = e.dataset.l; ctl(); body(); tip() }); $('#more') && ($('#more').onclick = () => { S.all = S.all ? 0 : 1; body() });
    }
    run(r)
  }
  const all = () => { hdr(); ctl(); body(); tip() };
  const reset = () => { S.st = ''; S.lga = ''; S.view = 'nat'; S.srch = 0; S.all = 0; S.z = 1; S.px = S.py = 0; HOV = null; $('#q').value = ''; all(); drawMap(); sync() };
  const pick = (st: string, l: string) => {
    (window as any).gtag?.('event', 'select_state', { state: st.replace(/ State$/, '') });
    S.st = st; S.lga = l; S.view = 'state'; S.all = 0; S.srch = 0; S.z = 1; S.px = S.py = 0; $('#q').value = '';
    all(); drawMap();
    if (mob900.matches) $('#mp').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  function mapInit() {
    all();
    $('#st').onchange = (e: any) => {
      (window as any).gtag?.('event', 'select_state', { state: e.target.value.replace(/ State$/, '') });
      S.st = e.target.value; S.lga = ''; S.view = 'state'; S.all = 0;
      all(); drawMap();
    };
    $('#lga').onchange = (e: any) => { S.lga = e.target.value; body(); tip() };
    $('#sbtn').onclick = () => { S.srch = 1; ctl(); body(); $('#q').focus() }; $('#bk').onclick = () => { S.srch = 0; $('#q').value = ''; ctl(); body() };
    $('#q').oninput = body; $('#q').onkeydown = (e: any) => { if (e.key === 'Escape') $('#bk').click(); if (e.key === 'Enter') $('#pb .res')?.click() };
    $('#qx').onclick = () => { $('#q').value = ''; body(); $('#q').focus() }; $('#allst').onclick = reset
  }

  V.dashboard = () => {
    const nat = votes('nat'), t = sum(nat) || 1, L = hasLga();
    const wins = L ? LG_WINS_2023 : stateWins(), wt = sum(wins) || 1;
    // Official figures
    const reg = S.y === '2023' ? 93469008 : S.y === '2019' ? 82300000 : 67422005;
    const vot = S.y === '2023' ? 24965218 : S.y === '2019' ? 28614190 : 29432083;
    const tn = S.y === '2023' ? 27.1 : S.y === '2019' ? 34.75 : 43.65;

    const ext = S.y === '2023' ? [['Most voter turnout', 'Jigawa State', 40.61, 'red'], ['Least voter turnout', 'Rivers State', 15.66, 'blu']] : [];

    const newsCard = `
      <div class="card" style="flex-basis: 100%;">
        <div class="row" style="justify-content:space-between; margin-bottom: 12px;">
          <p class="card-t">2027 Election Updates</p>
          <a href="https://onyeakuko.online" target="_blank" class="xs sub" style="text-decoration:none; display:flex; align-items:center; gap:4px;">
            Powered by OnyeAkụkọ 
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
          </a>
        </div>
        <div id="news-feed" style="display:flex; flex-direction:column; gap:0;">
          <p class="sm sub" style="padding: 12px 0;">Fetching latest reports...</p>
        </div>
      </div>`;

    return `<div class="page">
      <div class="cols pad" style="padding-left:20px;padding-right:20px;grid-template-columns:repeat(${nat.length},1fr)">
        ${nat.map((v, i) => {
      const p = v / t * 100;
      return `<div class="col"><div><div class="hd2"><p class="mdb">${P[i].k}</p><p class="sm sub">${mob.matches ? +(v / 1e6).toFixed(2) + 'M' : fmt(v)}</p></div><p class="pc" data-n="${p}" data-d="1" data-s="%">0%</p>${i < 3 && P[i].wiki ? `<p class="xs sub" style="margin-bottom:6px; padding-left:12px;">${P[i].w}</p>` : ''}<div class="grow" data-h="${(p * 6.28).toFixed(1)}px" style="height:0;background:${col(i)}"></div></div></div>`
    }).join('')}
      </div>
      <div class="cards">
        <div class="card">
          <p class="card-t">${L ? 'Party by Local Government' : 'Party by State'}</p>
          <div><p class="h5" data-n="${wt}" data-c="1">0</p><p class="sm sub">${L ? 'Local Government Areas' : 'States (incl. FCT)'}</p></div>
          <div class="stk" style="margin:8px 0">${wins.map((n, i) => `<div class="grow" data-w="${n / wt * 100}%" style="width:0;background:${col(i)}"></div>`).join('')}</div>
          ${wins.map((n, i) => `<div class="cl" style="--c:${col(i)}"><div class="fl"><p class="md">${P[i].k}</p><p class="xs sub">${P[i].n}</p></div><p class="md" data-n="${n}" data-c="1">0</p></div>`).join('')}
        </div>
        <div class="card">
          <p class="card-t">Voting Turnout</p>
          <div class="row" style="gap:12px;flex-wrap:wrap"><div class="stat" style="--c:var(--g100)"><div><p class="h5" data-n="${reg}" data-c="1">0</p><p class="sm sub">registered voters</p></div></div><div class="stat" style="--c:var(--org500)"><div><p class="h5" data-n="${vot}" data-c="1">0</p><p class="sm sub">voted</p></div></div></div>
          <div class="trk">${[0, 25, 50, 75, 100].map(x => `<i style="left:${x === 100 ? 'calc(100% - 1px)' : x + '%'}"></i>`).join('')}<div class="fill"><b class="grow" style="width:0" data-w="${tn}%"></b></div></div>
          ${ext.map(r => `<div class="cl b0" style="--c:var(--${r[3]}500);padding:4px 0"><div class="fl"><p class="xs sub">${r[0]}</p><p class="md">${r[1]}</p></div><p class="md">${r[2]}%</p></div>`).join('')}
          <div class="note sm">${layers}<p>${tn}% of registered voters cast a ballot in the ${S.y} General Elections${ext.length ? `, with ${ext[0][1]} having the most turnout and ${ext[1][1]} the least` : ''}.</p></div>
        </div>
        ${newsCard}
      </div>
    </div>`;
  };
  const ph = (t: string, r = '') => `<div class="ph"><h1 class="ttl">${t}</h1>${r}</div>`;
  V.compare = () => {
    const L = hasLga(), kind = L ? 'local government areas' : 'states',
      ks = (k: string) => k.split('::') as [string, string],
      o = UNITS().map(x => [x.n + '::' + x.s, L ? (mob.matches ? `${x.n} (${x.s.replace(' State', '')})` : `${x.n} · ${x.s.replace(' State', '')}`) : x.n]),
      stt = (k: string) => ks(k)[1].replace(' State', ''), nm2 = (k: string) => ks(k)[0],
      ok = S.c1 && S.c2;
    let body = `<div class="empty"><svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#adadad" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6v28h28M12 26l7-8 6 5 9-11"/></svg><p class="sm" style="color:var(--g800)">No comparisons made... yet</p><p class="xs sub">Select two ${kind} to compare voting statistics</p></div>`;
    if (ok) {
      const A = uv({ n: nm2(S.c1), s: stt(S.c1) === nm2(S.c1) ? fullName(nm2(S.c1)) : ks(S.c1)[1] }), B = uv({ n: nm2(S.c2), s: stt(S.c2) === nm2(S.c2) ? fullName(nm2(S.c2)) : ks(S.c2)[1] }),
        f = (a: number, b: number, fm: (n: number) => string = fmt) => [a, b].map((x, k) => `<div class="${(k ? b > a : a >= b) ? 'hl' : ''}">${fm(x)}</div>`).join(''),
        rw = (l: string, a: number, b: number, dot?: string | number, fm?: (n: number) => string) => `<div class="tr"><div>${dot ? `<i class="dot" style="background:${dot}"></i>` : ''}${l}</div>${f(a, b, fm)}</div>`,
        ta = sum(A), tb = sum(B), mg = (v: number[]) => { const s = rank(v); return (s[0][0] - s[1][0]) / (sum(v) || 1) * 100 };
      const nationalTurnout = S.y === '2023' ? 0.271 : S.y === '2019' ? 0.3475 : 0.4365;
      const ra = Math.round(ta / nationalTurnout), rb = Math.round(tb / nationalTurnout), ma = Math.round(ta * 0.55), mb = Math.round(tb * 0.55);
      body = `<div class="tw pad" style="padding:0"><div style="min-width:720px"><div class="tr h"><div>Metric</div><div>${nm2(S.c1)}</div><div>${nm2(S.c2)}</div></div>${L ? `<div class="tr mrow"><div>State</div><div>${stt(S.c1)}</div><div>${stt(S.c2)}</div></div>` : ''}${P.map((p, i) => rw(p.k + ' votes', A[i], B[i], col(i))).join('')}<div class="tr sep"><div>Total votes</div>${f(ta, tb)}</div>${rw('Winning margin', +mg(A).toFixed(1), +mg(B).toFixed(1), 0, x => x.toFixed(1))}<div class="gap"></div>${rw('Registered voters (est.)', ra, rb)}${rw('Male voters (est.)', ma, mb)}${rw('Female voters (est.)', ta - ma, tb - mb)}</div></div><div class="note sm pad" style="margin:16px 20px 0">${layers}<p>${nm2(ta > tb ? S.c1 : S.c2)} recorded ${fmt(Math.max(ta, tb))} votes against ${fmt(Math.min(ta, tb))} in ${nm2(ta > tb ? S.c2 : S.c1)}, with ${P[rank(ta > tb ? A : B)[0][1]].k} leading.</p></div>`;
    }
    return `<div class="page">${ph(L ? 'LGA Comparison' : 'State Comparison', `<div class="pair">${sel('c1', o, S.c1, '', mob.matches ? `Select ${L ? 'LGA' : 'state'} 1` : `Choose ${L ? 'LGA' : 'state'} 1`)}${sel('c2', o, S.c2, '', mob.matches ? `Select ${L ? 'LGA' : 'state'} 2` : `Choose ${L ? 'LGA' : 'state'} 2`)}</div>`)}${body}</div>`;
  };
  V.insights = () => {
    const L = hasLga(), what = L ? 'LGA' : 'State';

    // Calculate metrics for whatever unit is currently active (LGAs for 2023, States for older)
    const rows = UNITS().map(x => {
      const v = uv(x), [a, b] = rank(v), tot = sum(v);
      return { ...x, a, b, tot, d: tot ? ((a[0] - b[0]) / tot * 100) : 0 }
    }).filter(r => r.tot > 0).sort((p, q) => p.d - q.d);

    const card = (t: string, l: any[]) => `<div class="card"><div class="row" style="justify-content:space-between"><p class="card-t">${t}</p></div>${l.map(r => `<div class="cc"><div class="fl"><p class="md ell">${r.n}</p><p class="xs sub">${r.s}</p></div><div class="row"><div class="pk" style="--bg:${P[r.a[1]].tint};--c:${col(r.a[1])}"><div><p class="sm">${P[r.a[1]].k}</p><p class="xs sub">${fmt(r.a[0])}</p></div><i class="bar2"></i></div><div class="pts sm row" style="justify-content:center">${r.d.toFixed(1)} pts</div><div class="pk r" style="--c:${col(r.b[1])}"><div><p class="sm">${P[r.b[1]].k}</p><p class="xs sub">${fmt(r.b[0])}</p></div><i class="bar2"></i></div></div></div>`).join('') || `<p class="xs sub" style="padding: 12px 0;">No areas fit this criteria.</p>`}</div>`;

    // 1. Widest Contests (Landslides)
    const landslides = [...rows].filter(r => r.d > 40).reverse();

    // 2. Compute the 5 closest STATES (ignoring LGA level) for the 2027 watchlist
    const stateRows = STATES.map(x => {
      const v = votes(x.s);
      const [a, b] = rank(v);
      const tot = sum(v);
      return { n: x.n, s: 'State', a, b, tot, d: tot ? ((a[0] - b[0]) / tot * 100) : 0 };
    }).filter(r => r.tot > 0).sort((p, q) => p.d - q.d);

    const top5Battlegrounds = stateRows.slice(0, 5);

    // 3. 2027 Projections (Based on 2015-2023 structural growth)
    const projReg = Math.round(93469008 * 1.135); // Est. 13.5% historical growth rate
    const projTurnout = S.y === '2023' ? "26% - 30%" : "Trend Dependent";

    const projections = `
      <div class="card" style="flex-basis: 100%;">
        <p class="card-t" style="margin-bottom: 16px;">2027 Structural Projections</p>
        <div class="row" style="gap:24px; flex-wrap: wrap;">
          <div class="stat" style="--c:var(--blu500); flex-basis: 30%; min-width: 200px;">
            <div><p class="h5">${fmt(projReg)}</p><p class="sm sub">Est. Registered Voters</p></div>
          </div>
          <div class="stat" style="--c:var(--org500); flex-basis: 30%; min-width: 200px;">
            <div><p class="h5">${projTurnout}</p><p class="sm sub">Projected Turnout Baseline</p></div>
          </div>
          <div class="stat" style="--c:var(--pur500); flex-basis: 30%; min-width: 200px;">
            <div><p class="h5">5</p><p class="sm sub">Key Battleground States to Watch</p></div>
          </div>
        </div>
        <div class="note sm" style="margin-top: 24px;">
          ${layers}
          <p><strong>Methodological Note:</strong> 2027 projections are structurally derived from historical data. Voter registration extrapolates the ~13.5% growth observed between the 2019 and 2023 cycles. The 5 "States to watch" are calculated dynamically based on the tightest voting margins from the selected historical year.</p>
        </div>
      </div>
    `;

    return `<div class="page">
      ${ph(S.y + ' Insights')}
      <div class="cards">
        
        ${card(`Closest State Battlegrounds (< 5% Margin)`, top5Battlegrounds)}
        ${card(`Widest ${what} Contests`, landslides.slice(0, 5))}
        ${projections}
      </div>
    </div>`;
  };
  V.method = () => {
    const y = S.y, sec = (h: string, b: string) => `<section><h2 class="t18" style="margin-bottom:8px">${h}</h2>${b}</section>`, p = (t: string, st = '') => `<p class="r14 sub" style="${st}">${t}</p>`;
    const party = (i: number, pp: any[]) => `<div class="cl" style="--c:${pp[i].fill}"><div class="fl"><p class="md">${pp[i].k}</p><p class="xs sub">${pp[i].n} – ${pp[i].w}</p></div></div>`;
    return `<div class="page">${ph('Methodology')}<div class="pad" style="display:flex;flex-direction:column;gap:var(--s24);max-width:720px">
    ${sec('Data sources', p(`Presidential results come from official Independent National Electoral Commission (INEC) declarations. 2023 uses published LGA collation figures; 2015 and 2019 use the declared state totals. National totals for 2015 and 2019 are the sum of the 36 states and the FCT.`))}
    ${sec('Geographic coverage', p(`The map covers all 36 states, the FCT and (for 2023) 774 Local Government Areas. For 2015 and 2019 there is no LGA data, so the app works at state level: the map shows states only, and the comparison, insights and search views switch to states.`))}
    ${sec('Parties and candidates by election', p(`Parties and candidates differ per election. 2023 shows the four parties that drew major support; 2015 and 2019 were effectively two-horse races, so every other party is combined into “Others”.`, 'margin-bottom:12px') + `<div class="card" style="padding:var(--s12) var(--s16)">${[0, 1, 2, 3].map(i => party(i, YP['2023'])).join('')}</div><div class="card" style="padding:var(--s12) var(--s16);margin-top:12px">${[0, 1, 2].map(i => party(i, YP['2019'])).join('')}</div><div class="card" style="padding:var(--s12) var(--s16);margin-top:12px">${[0, 1, 2].map(i => party(i, YP['2015'])).join('')}</div>` + p(`Cards above: 2023, 2019, 2015. Candidate photos are fetched from Wikipedia and fall back to initials.`, 'margin-top:12px'))}
    ${sec('Winners', p(`On the dashboard, “Party by Local Government” (2023) or “Party by State” (2015, 2019) counts the units each party won – the party with the most votes in that unit.`))}
    ${sec('Turnout & registered voters', p(`National registered-voter and turnout figures are the official INEC numbers for each year (selected year: ${y}). In the comparison view, registered voters for an LGA or state are estimated by dividing its votes by the national turnout rate, and the male/female split uses a fixed 55 % / 45 % assumption. These are illustrative estimates, not official data.`))}
    ${sec('Limitations', `<ul class="r14 sub" style="padding-left:20px;display:flex;flex-direction:column;gap:8px"><li>2015 and 2019 are state-level only.</li><li>“Others” aggregates every party outside the top two (2015, 2019); 2023 omits minor parties.</li><li>Name mismatches between map geometry and result tables can produce zero-vote areas.</li><li>Registered-voter and gender figures for individual areas are estimates.</li></ul>`)}
    </div></div>`;
  };

  /* ---- interactive map: state hit-mask (canvas) + state/outline borders + per-state LGA shapes ---- */
  type Hov = { k: string; st: boolean; s: string } | null;

  let HOV: Hov = null, LAB: Uint8Array | null = null, drawn = '';
  let MW = 736, MH = 654;                       // real mask size, read from the PNG
  const maskImg = new Image();
  maskImg.onload = () => {
    MW = maskImg.naturalWidth; MH = maskImg.naturalHeight;
    const c = document.createElement('canvas'); c.width = MW; c.height = MH;
    const x = c.getContext('2d', { willReadFrequently: true })!;
    x.drawImage(maskImg, 0, 0);
    const d = x.getImageData(0, 0, MW, MH).data;
    LAB = new Uint8Array(MW * MH);
    for (let k = 0; k < LAB.length; k++) LAB[k] = d[k * 4];
    drawMap();
  };
  maskImg.src = MASK;
  const labelAt = (e: MouseEvent): number => {
    const r = $('#mcv').getBoundingClientRect(),
      px = Math.floor((e.clientX - r.left) / r.width * MW),
      py = Math.floor((e.clientY - r.top) / r.height * MH);
    return !LAB || px < 0 || py < 0 || px >= MW || py >= MH ? 0 : LAB[py * MW + px];
  };
  function drawMap() {
    const cv = $('#mcv') as HTMLCanvasElement | null; if (!cv || !LAB) return;
    if (cv.width !== MW || cv.height !== MH) { cv.width = MW; cv.height = MH }
    cv.style.width = '100%'; cv.style.height = 'auto';
    const x = cv.getContext('2d')!, im = x.createImageData(MW, MH), px = new Uint32Array(im.data.buffer),
      hv = HOV && HOV.st ? KEYS.indexOf(HOV.k) + 1 : 0, sl = S.view === 'state' ? KEYS.indexOf(S.st) + 1 : 0;
    const [base, hov, dim, dimHov] = (isDark() ? [46, 78, 30, 44] : [228, 200, 240, 226])
      .map(c => (0xff000000 | c << 16 | c << 8 | c) >>> 0);
    for (let k = 0; k < LAB.length; k++) {
      const l = LAB[k]; if (!l) continue;
      const d = sl > 0 && l !== sl;
      px[k] = l === hv ? (d ? dimHov : hov) : d ? dim : base;
    }
    x.putImageData(im, 0, 0);
  }

  function sync() {
    const sv = $('#lgasvg') as SVGElement | null, zw = $('#zw') as HTMLElement | null; if (!sv || !zw) return;
    const key = S.view === 'state' && LG[S.st] ? S.st : '', L = hasLga(), dk = key + (L ? '|lga' : '|st');
    if (drawn !== dk) { sv.innerHTML = key ? (L ? LG[key].map(([n, d]: any) => `<path class="lp" data-n="${n}" d="${d}"/>`).join('') : '') + `<path class="so" d="${SO[key]}"/>` : ''; drawn = dk }
    sv.querySelectorAll<SVGPathElement>('.lp').forEach(p => { const on = p.dataset.n === S.lga; p.classList.toggle('on', on); p.style.fill = on ? col(rank(lvt(p.dataset.n!, S.st))[0][1]) : '' });
    let sc = 1, cx = 368, cy = 327; const bb = key ? BB[key] : null; if (bb) { sc = Math.min(8, Math.min(736 / (bb[2] - bb[0]), 654 / (bb[3] - bb[1])) * .75); cx = (bb[0] + bb[2]) / 2; cy = (bb[1] + bb[3]) / 2 }
    sc *= S.z; const lim = sc * 45; S.px = Math.max(-lim, Math.min(lim, S.px)); S.py = Math.max(-lim, Math.min(lim, S.py)); if (S.z <= 1 && !key) S.px = S.py = 0;
    zw.style.transform = `translate(${(368 - cx * sc) / 7.36 + S.px}%,${(327 - cy * sc) / 6.54 + S.py}%) scale(${sc})`; $('#mp').style.touchAction = S.z > 1 ? 'none' : ''; zw.style.setProperty('--k', String(1 / sc));
    const ra = $('#allst'); if (ra) ra.disabled = S.view === 'nat' && S.z === 1 && !S.px && !S.py
  }
  function bindMap() {
    const mp = $('#mp') as HTMLElement; let drag: { x: number; y: number; px: number; py: number; m: boolean } | null = null, moved = false;
    mp.onpointerdown = (e: PointerEvent) => { if (S.z > 1 && !(e.target as HTMLElement).closest('.allst,.zoom')) { drag = { x: e.clientX, y: e.clientY, px: S.px, py: S.py, m: false }; mp.setPointerCapture?.(e.pointerId) } };
    mp.onpointerup = mp.onpointercancel = () => { if (drag) { moved = drag.m; drag = null; $('#zw').style.transition = '' } };
    mp.onpointermove = (e: PointerEvent) => {
      if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 4) drag.m = true; if (drag.m) { const zw = $('#zw'); zw.style.transition = 'none'; S.px = drag.px + dx / zw.offsetWidth * 100; S.py = drag.py + dy / zw.offsetHeight * 100; sync(); return } }
      const t = e.target as HTMLElement; let h: Hov = null; if (t.classList.contains('lp')) h = { k: t.dataset.n!, st: false, s: S.st }; else if (t.id === 'mcv') { const l = labelAt(e); if (l) h = { k: KEYS[l - 1], st: true, s: '' } }
      if (h?.k !== HOV?.k || h?.st !== HOV?.st) { HOV = h; drawMap() } tip(e.clientX, e.clientY)
    };
    mp.onpointerleave = () => { HOV = null; drawMap(); tip() };
    mp.onclick = (e: MouseEvent) => { if (moved) { moved = false; return } const t = e.target as HTMLElement; if (t.classList.contains('lp')) { S.lga = t.dataset.n!; ctl(); body(); tip(); if (!mob900.matches) $('.lr.on')?.scrollIntoView({ block: 'nearest' }) } else if (t.id === 'mcv') { const l = labelAt(e); if (l) pick(KEYS[l - 1], '') } };
    mp.querySelectorAll<HTMLElement>('[data-z]').forEach(b => b.onclick = () => { S.z = Math.max(.8, Math.min(3, S.z + .25 * +b.dataset.z!)); if (S.z <= 1) S.px = S.py = 0; sync() });
    HOV = null; drawn = ''; sync(); drawMap()
  }

  /* ---------- shell: tabs with sliding pill, year toggle with sliding thumb, theme toggle ---------- */
  const TABS = [['map', 'Map'], ['dashboard', 'National Dashboard'], ['compare', 'LGA Comparison'], ['insights', 'Political Insights'], ['method', 'Methodology']];
  const curId = () => V[location.hash.slice(1)] ? location.hash.slice(1) : 'map';
  let anim = false;
  const slide = (box: HTMLElement | null, el: string, target: HTMLElement | null) => {
    const k = box?.querySelector<HTMLElement>(el); if (!box || !k || !target) return;
    k.style.width = target.offsetWidth + 'px'; k.style.transform = `translateX(${target.offsetLeft}px)`; k.classList.add('on'); k.classList.toggle('anim', anim);
  };
  function buildTabs() { $('#tabs').innerHTML = TABS.map(([k, l]) => `<a href="#${k}" data-k="${k}">${l}</a>`).join('') + '<i class="ink" aria-hidden="true"></i>' }
  function buildYears() {
    const old = $('#year'); old.style.display = 'none'; old.innerHTML = YEARS.map(y => `<option>${y}</option>`).join('');
    let seg = $('#yseg'); if (!seg) { seg = document.createElement('div'); seg.id = 'yseg'; seg.className = 'yseg'; seg.setAttribute('role', 'radiogroup'); seg.setAttribute('aria-label', 'Election year'); old.after(seg) }
    seg.innerHTML = YEARS.map(y => `<button type="button" role="radio" data-y="${y}">${y}</button>`).join('') + '<i class="thumb" aria-hidden="true"></i>';
    seg.onclick = (e: any) => {
      const b = e.target.closest('button');
      if (b && b.dataset.y !== S.y) {
        setYear(b.dataset.y);
        (window as any).gtag?.('event', 'change_year', { year: b.dataset.y });
        chrome(); swap(page);
      }
    };
    old.onchange = (e: any) => {
      setYear(e.target.value);
      (window as any).gtag?.('event', 'change_year', { year: e.target.value });
      chrome(); swap(page);
    };
  }
  function buildTheme() {
    // Finds your new HTML button, or creates a fallback
    let b = $('#themeToggle') || $('#thm');

    if (!b) {
      b = document.createElement('button');
      b.id = 'thm';
      b.type = 'button';
      b.className = 'thm';
      b.innerHTML = `<svg class="moon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M16.5 11.5A6.5 6.5 0 0 1 8.5 3.5a6.5 6.5 0 1 0 8 8Z"/></svg><svg class="sun" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="10" cy="10" r="3.5"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4"/></svg>`; ($('#yseg') || $('#year')).after(b);
    }

    // Sync initial state on load
    b.setAttribute('aria-pressed', String(isDark()));
    if (isDark()) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    }

    b.onclick = () => {
      const d = !isDark();
      const h = document.documentElement;

      h.classList.add('tx');

      // Apply both dataset and class
      h.dataset.theme = d ? 'dark' : 'light';
      h.classList.toggle('dark', d);
      document.body.classList.toggle('dark', d);

      try { localStorage.setItem('nivo-theme', d ? 'dark' : 'light') } catch { }
      b.setAttribute('aria-pressed', String(d));

      // Update the text label if it exists
      const label = b.querySelector('.theme-label');
      if (label) label.textContent = d ? 'Light' : 'Dark';

      drawMap();
      setTimeout(() => h.classList.remove('tx'), 450);
    };
  }
  // Updates everything that is NOT the page body, immediately, so the pill/thumb can glide while the page cross-fades.
  function chrome() {
    const id = curId(), L = hasLga();
    $('#tabs a[data-k=compare]').textContent = L ? 'LGA Comparison' : 'State Comparison';
    $('#tabs').querySelectorAll('a').forEach((a: any) => a.toggleAttribute('aria-current', a.dataset.k === id) || 0);
    $('#tabs').querySelectorAll('a').forEach((a: any) => a.dataset.k === id ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
    slide($('#tabs'), '.ink', $('#tabs a[aria-current=page]'));
    const seg = $('#yseg'); seg.querySelectorAll('button').forEach((b: any) => b.setAttribute('aria-checked', String(b.dataset.y === S.y)));
    slide(seg, '.thumb', seg.querySelector(`button[data-y="${S.y}"]`)); $('#year').value = S.y;
    const label = (k: string, l: string) => k === 'compare' ? (L ? 'LGA Comparison' : 'State Comparison') : l;
    $('#navm').innerHTML = `<span class="chip">${label(id, TABS.find(t => t[0] === id)![1])}</span>${ic('sel', 20, '#919191')}<select id="navsel" aria-label="View">${TABS.map(([k, l]) => `<option value="${k}"${k === id ? ' selected' : ''}>${label(k, l)}</option>`).join('')}</select>`;
    $('#navsel').onchange = (e: any) => { location.hash = e.target.value };
  }
  // Fluid page swap: fade/slide the old page out, render, fade/slide the new one in. Last call wins if clicks are rapid.
  let tk = 0;
  function swap(fn: () => void) {
    const v = $('#v'); if (RM) { fn(); return }
    const my = ++tk; v.classList.add('out');
    setTimeout(() => { if (my !== tk) return; fn(); v.classList.remove('out'); v.classList.add('in'); requestAnimationFrame(() => requestAnimationFrame(() => v.classList.remove('in'))) }, 180);
  }
  function page() {
    const id = curId(), v = $('#v'); v.innerHTML = V[id]();
    if (id === 'map') { S.srch = 0; mapInit(); bindMap() } else run(v);
    if (id === 'compare') { const re = () => { S.c1 = $('#c1').value; S.c2 = $('#c2').value; page() }; $('#c1').onchange = re; $('#c2').onchange = re }
    if (id === 'dashboard') { loadElectionNews(); }
  }

  buildTabs(); buildYears(); buildTheme(); chrome(); page();
  requestAnimationFrame(() => requestAnimationFrame(() => { anim = true }));
  document.fonts?.ready.then(() => { chrome() });
  addEventListener('resize', () => chrome());
  addEventListener('hashchange', () => { chrome(); swap(page) });
  mob.addEventListener?.('change', () => { chrome(); page() });
}