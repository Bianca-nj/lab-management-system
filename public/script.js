function openLabsPage(floorId, floorName) {
    window.location.href = `lab.html?floorId=${floorId}&floorName=${encodeURIComponent(floorName)}`;
}

async function fetchFloors() {
    const res = await fetch('/floors');
    const floors = await res.json();
    const list = document.getElementById('floorList');
    list.innerHTML = '';
    floors.forEach(floor => {
        const li = document.createElement('li');

        const nameSpan = document.createElement('span');
        nameSpan.textContent = floor.name;
        nameSpan.style.cursor = 'pointer';
        nameSpan.onclick = () => openLabsPage(floor.id, floor.name);

        
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.classList.add('delete-btn');
        delBtn.onclick = () => deleteFloor(floor.id);
         li.appendChild(nameSpan);
        li.appendChild(delBtn);
        list.appendChild(li);
    });
}

async function addFloor() {
    const name = document.getElementById('floorName').value;
    if (!name.trim()) return alert('Enter a floor name');
    await fetch('/floors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
    document.getElementById('floorName').value = '';
    fetchFloors();
}

async function deleteFloor(id) {
    await fetch(`/floors/${id}`, {
        method: 'DELETE'
    });
    fetchFloors();
}

window.onload = fetchFloors;
