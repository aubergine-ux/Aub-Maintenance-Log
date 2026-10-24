const service = document.getElementById('service')
const date = document.getElementById('date')
const mileage = document.getElementById('mileage')
const cost = document.getElementById('cost')
const add = document.getElementById('add')
const list = document.getElementById('list')
const notes = document.getElementById('notes')
const search = document.getElementById('search')
const sort = document.getElementById('sort')
const exportBtn = document.getElementById('export')

const navBtns = document.querySelectorAll('.nav-btn')
const views = document.querySelectorAll('.view')
const stats = document.getElementById('stats')

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        views.forEach(view => view.classList.add('hidden'))
        navBtns.forEach(b => b.classList.remove('active'))

        document.getElementById(btn.dataset.view).classList.remove('hidden')
        btn.classList.add('active')

        if (btn.dataset.view === 'stats') renderStats()
    })
})

const renderStats = () => {
    if (!entries.length) {
        stats.innerHTML = '<p class="empty">No data yet. Log some services first!</p>'
        return
    }

    const total = entries.reduce((sum, e) => sum + Number(e.cost || 0), 0)
    const average = total / entries.length
    const highest = Math.max(...entries.map(e => Number(e.mileage)))

    const byService = {}
    entries.forEach(e => {
        byService[e.service] = (byService[e.service] || 0) + Number(e.cost || 0)
    })

    let breakdown = ''
    Object.entries(byService).sort((a, b) => b[1] - a[1]).forEach(([name, spent]) => {
        breakdown += `<div class="stat"><h3>$${spent.toFixed(2)}</h3><p>${name}</p></div>`
    })

    stats.innerHTML = `
        <div class="stat"><h3>${entries.length}</h3><p>services logged</p></div>
        <div class="stat"><h3>$${total.toFixed(2)}</h3><p>total spent</p></div>
        <div class="stat"><h3>$${average.toFixed(2)}</h3><p>average per service</p></div>
        <div class="stat"><h3>${highest.toLocaleString()}</h3><p>highest mileage</p></div>
        ${breakdown}
    `
}

let entries = JSON.parse(localStorage.getItem('entries')) || []

let editingIndex = null

const save = () => {
    localStorage.setItem('entries', JSON.stringify(entries))
}

const clear = document.getElementById('clear')

clear.addEventListener('click', () => {
    if (!confirm('Clear Entries?')) return
    entries = []
    save()
    render()
})

date.value = new Date().toISOString().split('T')[0]

mileage.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') add.click()
})

search.addEventListener('input', () => render())

sort.addEventListener('change', () => render())

exportBtn.addEventListener('click', () => {
    let csv = 'Service,Date,Mileage,Cost,Notes\n'
    entries.forEach(e => {
        csv += `"${e.service.replace(/"/g, '""')}",${e.date},${e.mileage},${e.cost},"${(e.notes || '').replace(/"/g, '""')}"\n`
    })

    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    link.download = 'aub-maintenance-log.csv'
    link.click()
})

const oilInterval = 5000

const renderReminder = () => {
    const oil = entries.filter(e => e.service.toLowerCase().includes('oil'))
    if (!oil.length) return ''

    const due = Math.max(...oil.map(e => Number(e.mileage))) + oilInterval
    const current = Math.max(...entries.map(e => Number(e.mileage)))
    const left = due - current
    const status = left <= 0 ? 'reminder overdue' : 'reminder'

    return `<p class="${status}">Next Oil Change due at ${due.toLocaleString()} miles (${left <= 0 ? 'overdue!' : `${left.toLocaleString()} to go`})</p>`
}

const render = () => {
    let html = ''
    if (sort.value === 'date') entries.sort((a, b) => b.date.localeCompare(a.date))
    else if (sort.value === 'cost') entries.sort((a, b) => b.cost - a.cost)
    else entries.sort((a, b) => b.mileage - a.mileage)
    const total = entries.reduce((sum, e) => sum + Number(e.cost || 0), 0)
    const highest = Math.max(...entries.map(e => Number(e.mileage)))
    entries.forEach((e, i) => {
        if (!e.service.toLowerCase().includes(search.value.toLowerCase())) return
        const highlight = Number(e.mileage) === highest ? 'entry latest' : 'entry'
        html += `
            <div class="${highlight}">
                <div class="entry-info">
                    <h3>${e.service}</h3>
                    <p>${e.date} - ${e.mileage} miles${e.cost ? ` - $${e.cost}` : ''}</p>
                    ${e.notes ? `<p>${e.notes}</p>` : ''}
                </div>
                <div class="entry-actions">
                    <button class="edit" data-index="${i}">Edit</button>
                    <button class="delete" data-index="${i}">Delete</button>
                </div>
            </div>
        `
    })
    if (!entries.length) html = '<p class="empty">No Entries yet. Add your first Service above!</p>'
    else if (!html) html = '<p class="empty">No Services match your search.</p>'
    list.innerHTML = renderReminder() + html + `<p class="count">${entries.length} entries logged - $${total.toFixed(2)} spent</p>`
}

add.addEventListener('click', () => {
    if (!service.value) return

    if (editingIndex !== null) {
        entries[editingIndex] = {
            service: service.value,
            date: date.value,
            mileage: mileage.value,
            cost: cost.value,
            notes: notes.value
        }
        editingIndex = null
        add.innerText = 'Add Entry'
    } else {
        entries.push ({
            service: service.value,
            date: date.value,
            mileage: mileage.value,
            cost: cost.value,
            notes: notes.value
        })
    }

    save()
    render()

    service.value = ''
    date.value = ''
    mileage.value = ''
    cost.value = ''
    notes.value = ''
})

list.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete')) {
        const i = e.target.dataset.index
        entries.splice(i, 1)
        save()
        render()
    } else if (e.target.classList.contains('edit')) {
        const i = e.target.dataset.index
        const entry = entries[i]

        service.value = entry.service
        date.value = entry.date
        mileage.value = entry.mileage
        cost.value = entry.cost || ''
        notes.value = entry.notes

        editingIndex = i
        add.innerText = 'Save Changes'
        service.focus()
    }
})

render()