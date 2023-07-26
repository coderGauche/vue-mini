const arr = [
    { id: 7, parentId: null },
    { id: 1, parentId: 1 },
    { id: 2, parentId: 1 },
    { id: 3, parentId: 2 },
    { id: 4, parentId: 2 },
    { id: 5, parentId: 3 }
]

// const newArr = [
//     {
//         parentId: 1, children: [
//             { id: 1, parentId: 1 },
//             { id: 2, parentId: 1 },
//         ],
//     },
//     {
//         parentId: 2, children: [
//             { id: 3, parentId: 1 },
//             { id: 4, parentId: 1 },
//         ],
//     },
//     {
//         parentId: 3, children: [
//             { id: 5, parentId: 1 },
//         ],
//     },
//     {
//         parentId: 7, children: [],
//     }
// ]



const conversion = (arr) => {
    const newMap = new Map()
    for (const item of arr) {
        if (item.parentId) {
            newMap.set(item.parentId, { parentId: item.parentId, children: [] })
        }
    }
    let newMap1 = [...newMap.values()]
    arr.forEach(item => {
        if (newMap1.find(e => item.parentId === e.parentId) && item.parentId) {
            newMap1[newMap1.findIndex(e => e.parentId === item.parentId)].children.push(item)
        }
    })
    console.log(newMap1);
}
conversion(arr)