'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { LayoutDashboard, Package, FileText, Edit, Printer, Plus, X } from 'lucide-react'

type Asset = {
  id: string;
  name: string;
  purchase_date: string;
  purchase_price: number;
  salvage_value: number;
  useful_life_years: number;
}

export default function AssetManagementApp() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [assets, setAssets] = useState<Asset[]>([])
  
  // State untuk Modal Form (Tambah/Edit)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', purchase_date: '', purchase_price: '', salvage_value: '', useful_life_years: ''
  })

  // Mengambil data aset
  const fetchAssets = async () => {
    const { data } = await supabase.from('assets').select('*').order('created_at', { ascending: false })
    if (data) setAssets(data)
  }

  useEffect(() => {
    fetchAssets()
  }, [])

  // Menghitung Depresiasi
  const calculateCurrentValue = (asset: Asset) => {
    const purchaseYear = new Date(asset.purchase_date).getFullYear()
    const currentYear = new Date().getFullYear()
    const yearsUsed = Math.max(0, currentYear - purchaseYear)
    if (yearsUsed >= asset.useful_life_years) return asset.salvage_value;
    const yearlyDepreciation = (asset.purchase_price - asset.salvage_value) / asset.useful_life_years
    return asset.purchase_price - (yearlyDepreciation * yearsUsed)
  }

  // Menyimpan data (Tambah / Edit)
  const saveAsset = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      name: form.name,
      purchase_date: form.purchase_date,
      purchase_price: Number(form.purchase_price),
      salvage_value: Number(form.salvage_value),
      useful_life_years: Number(form.useful_life_years),
    }

    if (editingId) {
      await supabase.from('assets').update(payload).eq('id', editingId)
    } else {
      await supabase.from('assets').insert([payload])
    }
    
    closeModal()
    fetchAssets()
  }

  const openEditModal = (asset: Asset) => {
    setEditingId(asset.id)
    setForm({
      name: asset.name,
      purchase_date: asset.purchase_date,
      purchase_price: asset.purchase_price.toString(),
      salvage_value: asset.salvage_value.toString(),
      useful_life_years: asset.useful_life_years.toString()
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setForm({ name: '', purchase_date: '', purchase_price: '', salvage_value: '', useful_life_years: '' })
  }

  // Fungsi Cetak Label Tagging
  const printTag = (asset: Asset) => {
    const tagNumber = `TAG-${asset.id.substring(0, 8).toUpperCase()}`
    const printWindow = window.open('', '', 'height=400,width=600')
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Tagging - ${tagNumber}</title>
          <style>
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .tag-container { border: 2px dashed #000; padding: 30px; text-align: center; width: 300px; }
            h2 { margin: 0 0 10px 0; font-size: 20px; }
            .tag-number { font-size: 28px; font-weight: bold; letter-spacing: 2px; }
            .company { font-size: 12px; color: #666; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="tag-container">
            <h2>${asset.name}</h2>
            <div class="tag-number">${tagNumber}</div>
            <div class="company">Properti Perusahaan</div>
          </div>
          <script>
            window.onload = () => { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  // Ringkasan Dashboard
  const totalAssets = assets.length
  const totalInvestment = assets.reduce((sum, a) => sum + a.purchase_price, 0)
  const currentTotalValue = assets.reduce((sum, a) => sum + calculateCurrentValue(a), 0)

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white border-r shadow-sm p-5 flex flex-col gap-2">
        <h2 className="text-xl font-bold mb-6 text-blue-600">AssetManager</h2>
        <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-3 p-3 rounded-lg text-left ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}>
          <LayoutDashboard size={20} /> Dashboard
        </button>
        <button onClick={() => setActiveTab('items')} className={`flex items-center gap-3 p-3 rounded-lg text-left ${activeTab === 'items' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}>
          <Package size={20} /> Daftar Barang
        </button>
        <button onClick={() => setActiveTab('reports')} className={`flex items-center gap-3 p-3 rounded-lg text-left ${activeTab === 'reports' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}>
          <FileText size={20} /> Laporan Depresiasi
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        
        {/* TAMPILAN DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Ringkasan Aset</h1>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm">Total Aset</p>
                <p className="text-3xl font-bold mt-2">{totalAssets} Unit</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm">Total Nilai Investasi (Beli)</p>
                <p className="text-3xl font-bold mt-2">Rp {totalInvestment.toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm">Total Nilai Buku Saat Ini</p>
                <p className="text-3xl font-bold mt-2 text-green-600">Rp {currentTotalValue.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
        )}

        {/* TAMPILAN DAFTAR BARANG */}
        {activeTab === 'items' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Daftar Barang</h1>
              <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                <Plus size={20} /> Tambah Barang
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4">No. Tagging</th>
                    <th className="p-4">Nama Aset</th>
                    <th className="p-4">Tahun Beli</th>
                    <th className="p-4">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map(asset => (
                    <tr key={asset.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-mono text-sm text-gray-500">TAG-{asset.id.substring(0,8).toUpperCase()}</td>
                      <td className="p-4 font-medium">{asset.name}</td>
                      <td className="p-4">{new Date(asset.purchase_date).getFullYear()}</td>
                      <td className="p-4 flex gap-2">
                        <button onClick={() => openEditModal(asset)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => printTag(asset)} className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg" title="Cetak Tagging">
                          <Printer size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAMPILAN LAPORAN */}
        {activeTab === 'reports' && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Laporan Nilai & Depresiasi</h1>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4">Nama Aset</th>
                    <th className="p-4">Harga Beli</th>
                    <th className="p-4">Nilai Sisa</th>
                    <th className="p-4">Umur (Thn)</th>
                    <th className="p-4">Penyusutan /Thn</th>
                    <th className="p-4">Nilai Buku (Sekarang)</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map(asset => {
                    const yearlyDepreciation = (asset.purchase_price - asset.salvage_value) / asset.useful_life_years;
                    return (
                      <tr key={asset.id} className="border-b">
                        <td className="p-4 font-medium">{asset.name}</td>
                        <td className="p-4">Rp {asset.purchase_price.toLocaleString('id-ID')}</td>
                        <td className="p-4">Rp {asset.salvage_value.toLocaleString('id-ID')}</td>
                        <td className="p-4">{asset.useful_life_years}</td>
                        <td className="p-4 text-red-600">- Rp {Math.round(yearlyDepreciation).toLocaleString('id-ID')}</td>
                        <td className="p-4 font-bold text-green-600">Rp {Math.round(calculateCurrentValue(asset)).toLocaleString('id-ID')}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL FORM TAMBAH/EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingId ? 'Edit Barang' : 'Tambah Barang'}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-black"><X size={24} /></button>
            </div>
            <form onSubmit={saveAsset} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nama Aset</label>
                <input type="text" required className="w-full p-2 border rounded" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tanggal Beli</label>
                <input type="date" required className="w-full p-2 border rounded" value={form.purchase_date} onChange={e => setForm({...form, purchase_date: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Harga Beli (Rp)</label>
                <input type="number" required className="w-full p-2 border rounded" value={form.purchase_price} onChange={e => setForm({...form, purchase_price: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nilai Sisa (Salvage) (Rp)</label>
                <input type="number" required className="w-full p-2 border rounded" value={form.salvage_value} onChange={e => setForm({...form, salvage_value: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Umur Ekonomis (Tahun)</label>
                <input type="number" required className="w-full p-2 border rounded" value={form.useful_life_years} onChange={e => setForm({...form, useful_life_years: e.target.value})} />
              </div>
              <button type="submit" className="bg-blue-600 text-white p-2 rounded mt-2 hover:bg-blue-700">
                {editingId ? 'Simpan Perubahan' : 'Simpan Aset'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}