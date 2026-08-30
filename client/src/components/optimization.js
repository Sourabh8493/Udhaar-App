const records = [
  {
    "_id": "6a7cc2861ba4cb7c285a3a54",
    "user": "6a5b6e4a7bb394d8d7810834",
    "from": {
      "email": "parthc@gmail.com",
      "name": "Parth de Caprio"
    },
    "to": {
      "email": "cristianog@gmail.com",
      "name": "Cristiano Gadekar"
    },
    "amount": 500,
    "note": "note",
    "status": "confirmed",
    "groupid": "6a7c58f3685e1fc1b2968d1c",
    "date": "2026-08-12T18:59:18.003Z",
    "__v": 0
  },
  {
    "_id": "6a7cc2941ba4cb7c285a3a55",
    "user": "6a5b6e4a7bb394d8d7810834",
    "from": {
      "email": "parthc@gmail.com",
      "name": "Parth de Caprio"
    },
    "to": {
      "email": "thomasp@gmail.com",
      "name": "Thomas Patil"
    },
    "amount": 200,
    "note": "note",
    "status": "confirmed",
    "groupid": "6a7c58f3685e1fc1b2968d1c",
    "date": "2026-08-12T18:59:32.456Z",
    "__v": 0
  },
  {
    "_id": "6a7cc2c41ba4cb7c285a3a56",
    "user": "6a5fd662933f264434e740f3",
    "from": {
      "email": "thomasp@gmail.com",
      "name": "Thomas Patil"
    },
    "to": {
      "email": "parthc@gmail.com",
      "name": "Parth de Caprio"
    },
    "amount": 100,
    "note": "note",
    "status": "pending",
    "groupid": "6a7c58f3685e1fc1b2968d1c",
    "date": "2026-08-12T19:00:20.391Z",
    "__v": 0
  },
  {
    "_id": "6a7cc2d71ba4cb7c285a3a57",
    "user": "6a5fd662933f264434e740f3",
    "from": {
      "email": "thomasp@gmail.com",
      "name": "Thomas Patil"
    },
    "to": {
      "email": "radhes@gmail.com",
      "name": "Radhe Smith"
    },
    "amount": 150,
    "note": "note",
    "status": "pending",
    "groupid": "6a7c58f3685e1fc1b2968d1c",
    "date": "2026-08-12T19:00:39.837Z",
    "__v": 0
  }
]

let opRecords = []

function createNetBalance(records) {
  const netBalance = {};
  const members = []

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    if (!members.some((m) => {
      return m.email === record.to.email
    })) {
      members.push({email: record.to.email, name: record.to.name})
    }
    if (!members.some((m) => {
      return m.email === record.from.email
    })) {
      members.push({email: record.from.email, name: record.from.name})
    }

    if (!netBalance[record.to.email]) {
      netBalance[record.to.email] = -record.amount
    } else {
      netBalance[record.to.email] -= record.amount
    }
    if (!netBalance[record.from.email]) {
      netBalance[record.from.email] = record.amount
    } else {
      netBalance[record.from.email] += record.amount
    }
  }

  return {netBalance, members}
}

let {netBalance, members} = createNetBalance(records)

function optimize(netBalance, members) {
  let min = 100000000000000000
  let max = -100000000000000000

  let minEmail = null
  let maxEmail = null
  let minName = null
  let maxName = null

  let amount = 0

  for (let i=0; i < members.length; i++) {
    amount = netBalance[members[i].email]

    if (amount > max) {
      max = amount
      maxEmail = members[i].email
      maxName = members[i].name
    }
    if (amount < min) {
      min = amount
      minEmail = members[i].email
      minName = members[i].name
    }
  }

  if (max === 0 || min === 0) {
    return
  }

  opRecords.push({
    from: {email: maxEmail, name: maxName},
    to: {email: minEmail, name: minName},
    amount: -netBalance[minEmail]
  })

  const newNetBalance = {...netBalance}
  newNetBalance[minEmail] = 0
  newNetBalance[maxEmail] = netBalance[maxEmail] + netBalance[minEmail]

  optimize(newNetBalance, members)
}

const a = (n) => {
  if (n === 5) {
    return n
  }
  
  console.log(n)
  n += 1
  return a(n)
}

console.log(a(1))