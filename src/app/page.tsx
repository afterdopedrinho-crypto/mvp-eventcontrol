"use client"

import { useState, useEffect, useCallback } from 'react'
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Edit3, 
  Trash2, 
  Users, 
  MapPin, 
  Clock,
  BarChart3,
  PieChart,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  Bell,
  Download,
  MessageSquare,
  Star,
  AlertTriangle,
  CheckCircle,
  Filter,
  Search,
  RefreshCw,
  Share2,
  Eye,
  EyeOff,
  Zap,
  Target,
  Award,
  Calculator,
  Camera,
  FileText,
  Settings,
  Moon,
  Sun,
  ShoppingCart,
  Coffee,
  Package,
  Receipt,
  Percent,
  Activity,
  Ticket,
  Slider,
  Undo,
  Redo,
  RotateCcw
} from 'lucide-react'

interface Event {
  id: string
  name: string
  date: string
  location: string
  attendees: number
  budget: number
  status: 'active' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  description?: string
}

interface Product {
  id: string
  name: string
  category: 'bar' | 'loja'
  type: 'package' | 'unit'
  purchasePrice: number // Custo individual
  unitPrice: number
  packagePrice: number
  packageUnits: number
  salePrice: number
  quantity: number
  packageQuantity: number
  sold: number
  returnedPackages?: number
  remainingUnits?: number
}

interface Sale {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  total: number
  date: string
  category: 'bar' | 'loja'
}

interface Expense {
  id: string
  eventId: string
  description: string
  amount: number
  category: string
  date: string
  approved: boolean
}

interface ExpenseCategory {
  id: string
  name: string
  items: ExpenseItem[]
  expanded: boolean
}

interface ExpenseItem {
  id: string
  description: string
  amount: number
}

interface Revenue {
  id: string
  eventId: string
  description: string
  amount: number
  date: string
  category: string
}

interface Notification {
  id: string
  type: 'warning' | 'info' | 'success' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
}

interface EventTemplate {
  id: string
  name: string
  description: string
  estimatedBudget: number
  categories: string[]
  products: Partial<Product>[]
}

interface TicketInfo {
  currentTicketPrice: number
  ticketsSold: number
  eventTotalCost: number
}

interface UndoAction {
  id: string
  type: 'delete_product' | 'add_product' | 'update_product'
  data: any
  timestamp: Date
  description: string
}

export default function EventControlPro() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ingressos' | 'bar' | 'loja' | 'relatorio' | 'despesas'>('dashboard')
  const [darkMode, setDarkMode] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [calculatorValue, setCalculatorValue] = useState('')
  const [showFloatingMenu, setShowFloatingMenu] = useState(false)
  
  // Data states
  const [events, setEvents] = useState<Event[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([])
  const [revenues, setRevenues] = useState<Revenue[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [templates, setTemplates] = useState<EventTemplate[]>([])
  const [ticketInfo, setTicketInfo] = useState<TicketInfo>({
    currentTicketPrice: 50,
    ticketsSold: 0,
    eventTotalCost: 15000
  })
  
  // Undo/Redo functionality
  const [undoHistory, setUndoHistory] = useState<UndoAction[]>([])
  const [redoHistory, setRedoHistory] = useState<UndoAction[]>([])
  
  // UI states
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [editingEvent, setEditingEvent] = useState<string | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showCustomProductForm, setShowCustomProductForm] = useState(false)
  const [barLojaSlider, setBarLojaSlider] = useState(50)
  
  // Form states
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'bar' as 'bar' | 'loja',
    type: 'package' as 'package' | 'unit',
    packagePrice: '',
    packageUnits: '',
    salePrice: '',
    packageQuantity: '',
    purchasePrice: '' // Novo campo para custo
  })
  
  const [newExpense, setNewExpense] = useState({
    eventId: '',
    description: '',
    amount: '',
    category: 'food'
  })

  // Função para formatar números com pontuação brasileira
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  const formatNumber = (value: number) => {
    return value.toLocaleString('pt-BR')
  }

  // Undo/Redo functions
  const addUndoAction = (action: Omit<UndoAction, 'id' | 'timestamp'>) => {
    const undoAction: UndoAction = {
      ...action,
      id: Date.now().toString(),
      timestamp: new Date()
    }
    setUndoHistory(prev => [undoAction, ...prev.slice(0, 9)]) // Keep only last 10 actions
    setRedoHistory([]) // Clear redo history when new action is performed
  }

  const performUndo = () => {
    if (undoHistory.length === 0) return

    const action = undoHistory[0]
    setRedoHistory(prev => [action, ...prev])
    setUndoHistory(prev => prev.slice(1))

    switch (action.type) {
      case 'delete_product':
        // Restore deleted product
        setProducts(prev => [...prev, action.data])
        addNotification('success', 'Produto Restaurado', `${action.data.name} foi restaurado`)
        break
      case 'add_product':
        // Remove added product
        setProducts(prev => prev.filter(p => p.id !== action.data.id))
        addNotification('success', 'Adição Desfeita', `${action.data.name} foi removido`)
        break
      case 'update_product':
        // Restore previous product state
        setProducts(prev => prev.map(p => p.id === action.data.id ? action.data : p))
        addNotification('success', 'Alteração Desfeita', `${action.data.name} foi restaurado`)
        break
    }
  }

  const performRedo = () => {
    if (redoHistory.length === 0) return

    const action = redoHistory[0]
    setUndoHistory(prev => [action, ...prev])
    setRedoHistory(prev => prev.slice(1))

    switch (action.type) {
      case 'delete_product':
        // Delete product again
        setProducts(prev => prev.filter(p => p.id !== action.data.id))
        addNotification('success', 'Exclusão Refeita', `${action.data.name} foi excluído novamente`)
        break
      case 'add_product':
        // Add product again
        setProducts(prev => [...prev, action.data])
        addNotification('success', 'Adição Refeita', `${action.data.name} foi adicionado novamente`)
        break
      case 'update_product':
        // Apply update again
        setProducts(prev => prev.map(p => p.id === action.data.id ? action.data : p))
        addNotification('success', 'Alteração Refeita', `${action.data.name} foi alterado novamente`)
        break
    }
  }

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = {
      events: localStorage.getItem('eventcontrol-events'),
      products: localStorage.getItem('eventcontrol-products'),
      sales: localStorage.getItem('eventcontrol-sales'),
      expenses: localStorage.getItem('eventcontrol-expenses'),
      expenseCategories: localStorage.getItem('eventcontrol-expensecategories'),
      revenues: localStorage.getItem('eventcontrol-revenues'),
      notifications: localStorage.getItem('eventcontrol-notifications'),
      templates: localStorage.getItem('eventcontrol-templates'),
      ticketInfo: localStorage.getItem('eventcontrol-ticketinfo'),
      darkMode: localStorage.getItem('eventcontrol-darkmode'),
      undoHistory: localStorage.getItem('eventcontrol-undohistory')
    }

    if (savedData.events) setEvents(JSON.parse(savedData.events))
    if (savedData.products) setProducts(JSON.parse(savedData.products))
    if (savedData.sales) setSales(JSON.parse(savedData.sales))
    if (savedData.expenses) setExpenses(JSON.parse(savedData.expenses))
    if (savedData.expenseCategories) setExpenseCategories(JSON.parse(savedData.expenseCategories))
    if (savedData.revenues) setRevenues(JSON.parse(savedData.revenues))
    if (savedData.notifications) setNotifications(JSON.parse(savedData.notifications))
    if (savedData.templates) setTemplates(JSON.parse(savedData.templates))
    if (savedData.ticketInfo) setTicketInfo(JSON.parse(savedData.ticketInfo))
    if (savedData.darkMode) setDarkMode(JSON.parse(savedData.darkMode))
    if (savedData.undoHistory) setUndoHistory(JSON.parse(savedData.undoHistory))
  }, [])

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('eventcontrol-events', JSON.stringify(events))
  }, [events])

  useEffect(() => {
    localStorage.setItem('eventcontrol-products', JSON.stringify(products))
  }, [products])

  useEffect(() => {
    localStorage.setItem('eventcontrol-sales', JSON.stringify(sales))
  }, [sales])

  useEffect(() => {
    localStorage.setItem('eventcontrol-expenses', JSON.stringify(expenses))
  }, [expenses])

  useEffect(() => {
    localStorage.setItem('eventcontrol-expensecategories', JSON.stringify(expenseCategories))
  }, [expenseCategories])

  useEffect(() => {
    localStorage.setItem('eventcontrol-revenues', JSON.stringify(revenues))
  }, [revenues])

  useEffect(() => {
    localStorage.setItem('eventcontrol-notifications', JSON.stringify(notifications))
  }, [notifications])

  useEffect(() => {
    localStorage.setItem('eventcontrol-templates', JSON.stringify(templates))
  }, [templates])

  useEffect(() => {
    localStorage.setItem('eventcontrol-ticketinfo', JSON.stringify(ticketInfo))
  }, [ticketInfo])

  useEffect(() => {
    localStorage.setItem('eventcontrol-darkmode', JSON.stringify(darkMode))
  }, [darkMode])

  useEffect(() => {
    localStorage.setItem('eventcontrol-undohistory', JSON.stringify(undoHistory))
  }, [undoHistory])

  // Initialize with sample data if empty
  useEffect(() => {
    if (events.length === 0) {
      const sampleEvents: Event[] = [
        {
          id: '1',
          name: 'Festival de Verão 2024',
          date: '2024-12-15',
          location: 'Parque Central',
          attendees: 500,
          budget: 25000,
          status: 'active',
          priority: 'high',
          description: 'Grande festival de música com bar e loja de souvenirs'
        }
      ]
      
      const sampleProducts: Product[] = [
        {
          id: '1',
          name: 'Cerveja Artesanal',
          category: 'bar',
          type: 'package',
          purchasePrice: 3.50, // Custo individual
          unitPrice: 3.50,
          packagePrice: 84.00,
          packageUnits: 24,
          salePrice: 8.00,
          quantity: 192,
          packageQuantity: 8,
          sold: 45,
          returnedPackages: 0,
          remainingUnits: 0
        },
        {
          id: '2',
          name: 'Camiseta do Evento',
          category: 'loja',
          type: 'unit',
          purchasePrice: 15.00, // Custo individual
          unitPrice: 15.00,
          packagePrice: 15.00,
          packageUnits: 1,
          salePrice: 35.00,
          quantity: 100,
          packageQuantity: 100,
          sold: 23,
          returnedPackages: 0,
          remainingUnits: 0
        },
        {
          id: '3',
          name: 'Água Mineral',
          category: 'bar',
          type: 'package',
          purchasePrice: 1.00, // Custo individual
          unitPrice: 1.00,
          packagePrice: 12.00,
          packageUnits: 12,
          salePrice: 3.00,
          quantity: 300,
          packageQuantity: 25,
          sold: 87,
          returnedPackages: 0,
          remainingUnits: 0
        },
        {
          id: '4',
          name: 'Gelo em Cubo',
          category: 'bar',
          type: 'unit',
          purchasePrice: 5.00, // Custo individual
          unitPrice: 5.00,
          packagePrice: 5.00,
          packageUnits: 1,
          salePrice: 10.00,
          quantity: 50,
          packageQuantity: 50,
          sold: 12,
          returnedPackages: 0,
          remainingUnits: 0
        }
      ]

      const sampleSales: Sale[] = [
        {
          id: '1',
          productId: '1',
          quantity: 45,
          unitPrice: 8.00,
          total: 360.00,
          date: '2024-10-08',
          category: 'bar'
        },
        {
          id: '2',
          productId: '2',
          quantity: 23,
          unitPrice: 35.00,
          total: 805.00,
          date: '2024-10-08',
          category: 'loja'
        }
      ]

      const sampleExpenseCategories: ExpenseCategory[] = [
        {
          id: '1',
          name: 'Decoração',
          expanded: false,
          items: []
        },
        {
          id: '2',
          name: 'Marketing',
          expanded: false,
          items: []
        },
        {
          id: '3',
          name: 'Logística',
          expanded: false,
          items: []
        },
        {
          id: '4',
          name: 'Passagem Aérea',
          expanded: false,
          items: []
        },
        {
          id: '5',
          name: 'Artista',
          expanded: false,
          items: []
        },
        {
          id: '6',
          name: 'Hotel',
          expanded: false,
          items: []
        },
        {
          id: '7',
          name: 'Alimentação',
          expanded: false,
          items: []
        }
      ]

      const sampleTemplates: EventTemplate[] = [
        {
          id: '1',
          name: 'Festival Musical',
          description: 'Template para festivais de música com bar e loja',
          estimatedBudget: 25000,
          categories: ['sound', 'food', 'security', 'marketing'],
          products: [
            { name: 'Cerveja', category: 'bar', purchasePrice: 3.50, salePrice: 8.00 },
            { name: 'Camiseta', category: 'loja', purchasePrice: 15.00, salePrice: 35.00 }
          ]
        }
      ]
      
      setEvents(sampleEvents)
      setProducts(sampleProducts)
      setSales(sampleSales)
      setExpenseCategories(sampleExpenseCategories)
      setTemplates(sampleTemplates)
    }
  }, [events.length])

  // Calculator functions
  const handleCalculatorInput = (value: string) => {
    if (value === '=') {
      try {
        const result = eval(calculatorValue)
        setCalculatorValue(result.toString())
      } catch {
        setCalculatorValue('Erro')
      }
    } else if (value === 'C') {
      setCalculatorValue('')
    } else if (value === '←') {
      setCalculatorValue(calculatorValue.slice(0, -1))
    } else {
      setCalculatorValue(calculatorValue + value)
    }
  }

  // Business logic functions
  const addProduct = () => {
    if (!newProduct.name || !newProduct.salePrice) return

    let product: Product

    if (newProduct.type === 'package') {
      if (!newProduct.packagePrice || !newProduct.packageUnits || !newProduct.packageQuantity) return

      const packagePrice = parseFloat(newProduct.packagePrice)
      const packageUnits = parseInt(newProduct.packageUnits)
      const packageQuantity = parseInt(newProduct.packageQuantity)
      const unitPrice = packagePrice / packageUnits
      const totalUnits = packageQuantity * packageUnits
      const purchasePrice = newProduct.purchasePrice ? parseFloat(newProduct.purchasePrice) : unitPrice

      product = {
        id: Date.now().toString(),
        name: newProduct.name,
        category: newProduct.category,
        type: 'package',
        purchasePrice: purchasePrice,
        unitPrice: unitPrice,
        packagePrice: packagePrice,
        packageUnits: packageUnits,
        salePrice: parseFloat(newProduct.salePrice),
        quantity: totalUnits,
        packageQuantity: packageQuantity,
        sold: 0,
        returnedPackages: 0,
        remainingUnits: 0
      }
    } else {
      if (!newProduct.packageQuantity) return

      const salePrice = parseFloat(newProduct.salePrice)
      const purchasePrice = newProduct.purchasePrice ? parseFloat(newProduct.purchasePrice) : salePrice * 0.6
      const quantity = parseInt(newProduct.packageQuantity)

      product = {
        id: Date.now().toString(),
        name: newProduct.name,
        category: newProduct.category,
        type: 'unit',
        purchasePrice: purchasePrice,
        unitPrice: purchasePrice,
        packagePrice: purchasePrice,
        packageUnits: 1,
        salePrice: salePrice,
        quantity: quantity,
        packageQuantity: quantity,
        sold: 0,
        returnedPackages: 0,
        remainingUnits: 0
      }
    }

    setProducts([...products, product])
    addUndoAction({
      type: 'add_product',
      data: product,
      description: `Produto ${product.name} adicionado`
    })
    
    setNewProduct({ 
      name: '', 
      category: 'bar', 
      type: 'package', 
      packagePrice: '', 
      packageUnits: '', 
      salePrice: '', 
      packageQuantity: '',
      purchasePrice: ''
    })
    setShowCustomProductForm(false)
    
    addNotification('success', 'Produto Adicionado', `${product.name} foi adicionado com sucesso`)
  }

  const deleteProduct = (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    // Check if product has sales
    const productSales = sales.filter(s => s.productId === productId)
    if (productSales.length > 0) {
      addNotification('error', 'Não é possível excluir', 'Este produto possui vendas registradas')
      return
    }

    // Add to undo history before deleting
    addUndoAction({
      type: 'delete_product',
      data: product,
      description: `Produto ${product.name} excluído`
    })

    setProducts(products.filter(p => p.id !== productId))
    addNotification('success', 'Produto Excluído', `${product.name} foi excluído com sucesso`)
  }

  const updateProductSale = (productId: string, quantitySold: number) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    if (quantitySold > product.quantity) {
      addNotification('error', 'Estoque Insuficiente', 'Não há estoque suficiente para esta venda')
      return
    }

    // Store previous state for undo
    addUndoAction({
      type: 'update_product',
      data: product,
      description: `Venda de ${product.name} atualizada`
    })

    // Update product sold quantity
    setProducts(products.map(p => 
      p.id === productId 
        ? { ...p, sold: quantitySold }
        : p
    ))

    // Update or create sale record
    const existingSale = sales.find(s => s.productId === productId)
    if (existingSale) {
      setSales(sales.map(s => 
        s.productId === productId 
          ? { ...s, quantity: quantitySold, total: quantitySold * product.salePrice }
          : s
      ))
    } else if (quantitySold > 0) {
      const sale: Sale = {
        id: Date.now().toString(),
        productId,
        quantity: quantitySold,
        unitPrice: product.salePrice,
        total: quantitySold * product.salePrice,
        date: new Date().toISOString().split('T')[0],
        category: product.category
      }
      setSales([...sales, sale])
    }

    addNotification('success', 'Venda Atualizada', `Venda de ${product.name} atualizada com sucesso`)
  }

  const updateProductReturns = (productId: string, returnedPackages: number, remainingUnits: number) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    // Store previous state for undo
    addUndoAction({
      type: 'update_product',
      data: product,
      description: `Devoluções de ${product.name} atualizadas`
    })

    // Para produtos do bar, calcular vendas baseado em pacotes devolvidos
    if (product.category === 'bar' && product.type === 'package') {
      const packagesNotReturned = product.packageQuantity - (returnedPackages || 0)
      const unitsNotReturned = packagesNotReturned * product.packageUnits
      const unitsSold = unitsNotReturned - (remainingUnits || 0)
      
      // Atualizar vendas automaticamente
      setProducts(products.map(p => 
        p.id === productId 
          ? { ...p, sold: Math.max(0, unitsSold), returnedPackages: returnedPackages || 0, remainingUnits: remainingUnits || 0 }
          : p
      ))

      // Atualizar registro de venda
      const existingSale = sales.find(s => s.productId === productId)
      if (existingSale) {
        setSales(sales.map(s => 
          s.productId === productId 
            ? { ...s, quantity: Math.max(0, unitsSold), total: Math.max(0, unitsSold) * product.salePrice }
            : s
        ))
      } else if (unitsSold > 0) {
        const sale: Sale = {
          id: Date.now().toString(),
          productId,
          quantity: unitsSold,
          unitPrice: product.salePrice,
          total: unitsSold * product.salePrice,
          date: new Date().toISOString().split('T')[0],
          category: product.category
        }
        setSales([...sales, sale])
      }
    } else {
      // Para produtos da loja, calcular vendas baseado em quantidade devolvida
      const unitsSold = product.packageQuantity - (returnedPackages || 0)
      
      setProducts(products.map(p => 
        p.id === productId 
          ? { ...p, sold: Math.max(0, unitsSold), returnedPackages: returnedPackages || 0, remainingUnits: remainingUnits || 0 }
          : p
      ))

      // Atualizar registro de venda
      const existingSale = sales.find(s => s.productId === productId)
      if (existingSale) {
        setSales(sales.map(s => 
          s.productId === productId 
            ? { ...s, quantity: Math.max(0, unitsSold), total: Math.max(0, unitsSold) * product.salePrice }
            : s
        ))
      } else if (unitsSold > 0) {
        const sale: Sale = {
          id: Date.now().toString(),
          productId,
          quantity: unitsSold,
          unitPrice: product.salePrice,
          total: unitsSold * product.salePrice,
          date: new Date().toISOString().split('T')[0],
          category: product.category
        }
        setSales([...sales, sale])
      }
    }
  }

  const addExpenseItem = (categoryId: string, description: string, amount: number) => {
    if (!description || amount <= 0) return

    const newItem: ExpenseItem = {
      id: Date.now().toString(),
      description,
      amount
    }

    setExpenseCategories(expenseCategories.map(cat => 
      cat.id === categoryId 
        ? { ...cat, items: [...cat.items, newItem] }
        : cat
    ))

    addNotification('success', 'Despesa Adicionada', `${description} foi adicionada com sucesso`)
  }

  const removeExpenseItem = (categoryId: string, itemId: string) => {
    setExpenseCategories(expenseCategories.map(cat => 
      cat.id === categoryId 
        ? { ...cat, items: cat.items.filter(item => item.id !== itemId) }
        : cat
    ))
  }

  const toggleExpenseCategory = (categoryId: string) => {
    setExpenseCategories(expenseCategories.map(cat => 
      cat.id === categoryId 
        ? { ...cat, expanded: !cat.expanded }
        : cat
    ))
  }

  const addNotification = (type: Notification['type'], title: string, message: string) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date(),
      read: false
    }
    setNotifications(prev => [notification, ...prev])
  }

  const exportToPDF = async () => {
    setIsExporting(true)
    
    // Simulate PDF generation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const reportData = {
      summary: {
        totalRevenue: getTotalRevenue(),
        totalExpenses: getTotalExpenses(),
        netProfit: getNetProfit(),
        barRevenue: getBarRevenue(),
        lojaRevenue: getLojaRevenue()
      },
      products,
      sales,
      expenses,
      revenues,
      generatedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `eventcontrol-relatorio-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    setIsExporting(false)
    addNotification('success', 'Relatório Exportado', 'Relatório foi exportado com sucesso!')
  }

  // Calculation functions
  const getTotalRevenue = () => {
    return sales.reduce((sum, sale) => sum + sale.total, 0) + 
           revenues.reduce((sum, rev) => sum + rev.amount, 0) +
           (ticketInfo.currentTicketPrice * ticketInfo.ticketsSold)
  }

  const getTotalExpenses = () => {
    const productCosts = products.reduce((sum, product) => {
      const packagesNotReturned = product.packageQuantity - (product.returnedPackages || 0)
      return sum + (product.packagePrice * packagesNotReturned)
    }, 0)

    const categoriesExpenses = expenseCategories.reduce((sum, category) => {
      return sum + category.items.reduce((catSum, item) => catSum + item.amount, 0)
    }, 0)

    return expenses.reduce((sum, exp) => sum + exp.amount, 0) + productCosts + categoriesExpenses + ticketInfo.eventTotalCost
  }

  const getNetProfit = () => {
    return getTotalRevenue() - getTotalExpenses()
  }

  const getBarRevenue = () => {
    return sales.filter(s => s.category === 'bar').reduce((sum, sale) => sum + sale.total, 0)
  }

  const getLojaRevenue = () => {
    return sales.filter(s => s.category === 'loja').reduce((sum, sale) => sum + sale.total, 0)
  }

  const getBarInvestment = () => {
    return products.filter(p => p.category === 'bar').reduce((sum, p) => {
      const packagesNotReturned = p.packageQuantity - (p.returnedPackages || 0)
      return sum + (p.packagePrice * packagesNotReturned)
    }, 0)
  }

  const getLojaInvestment = () => {
    return products.filter(p => p.category === 'loja').reduce((sum, p) => {
      const packagesNotReturned = p.packageQuantity - (p.returnedPackages || 0)
      return sum + (p.packagePrice * packagesNotReturned)
    }, 0)
  }

  const getBarProfit = () => {
    return getBarRevenue() - getBarInvestment()
  }

  const getLojaProfit = () => {
    return getLojaRevenue() - getLojaInvestment()
  }

  const getBarMargin = () => {
    const revenue = getBarRevenue()
    return revenue > 0 ? ((getBarProfit() / revenue) * 100) : 0
  }

  const getLojaMargin = () => {
    const revenue = getLojaRevenue()
    return revenue > 0 ? ((getLojaProfit() / revenue) * 100) : 0
  }

  const getBarGrossRevenue = () => {
    return products.filter(p => p.category === 'bar').reduce((sum, p) => sum + (p.salePrice * p.sold), 0)
  }

  // Função para calcular receita bruta total
  const getTotalGrossRevenue = () => {
    return products.reduce((sum, p) => sum + (p.salePrice * p.sold), 0)
  }

  // Função para calcular receita líquida (receita bruta - custo dos produtos vendidos)
  const getNetRevenue = (category?: 'bar' | 'loja') => {
    const filteredProducts = category ? products.filter(p => p.category === category) : products
    
    return filteredProducts.reduce((sum, p) => {
      const grossRevenue = p.salePrice * p.sold
      const productCost = p.purchasePrice * p.sold
      return sum + (grossRevenue - productCost)
    }, 0)
  }

  // Função para calcular valor das sobras em reais
  const getSobraValue = (category?: 'bar' | 'loja') => {
    const filteredProducts = category ? products.filter(p => p.category === category) : products
    
    return filteredProducts.reduce((sum, p) => {
      return sum + (p.purchasePrice * (p.remainingUnits || 0))
    }, 0)
  }

  // Função para calcular quanto falta para pagar o evento
  const getAmountNeededToPay = () => {
    const totalRevenue = getTotalRevenue()
    const totalCosts = getTotalExpenses()
    return Math.max(0, totalCosts - totalRevenue)
  }

  // Função para calcular quantos produtos precisam ser vendidos para quitar o evento
  const getProductsNeededToPayEvent = () => {
    const amountNeeded = getAmountNeededToPay()
    if (amountNeeded <= 0) return { bar: 0, loja: 0, mixed: 0 }

    const barProducts = products.filter(p => p.category === 'bar')
    const lojaProducts = products.filter(p => p.category === 'loja')

    const avgBarProfit = barProducts.length > 0 ? 
      barProducts.reduce((sum, p) => sum + (p.salePrice - p.purchasePrice), 0) / barProducts.length : 0
    
    const avgLojaProfit = lojaProducts.length > 0 ? 
      lojaProducts.reduce((sum, p) => sum + (p.salePrice - p.purchasePrice), 0) / lojaProducts.length : 0

    const barSliderPercent = (100 - barLojaSlider) / 100
    const lojaSliderPercent = barLojaSlider / 100

    return {
      bar: avgBarProfit > 0 ? Math.ceil(amountNeeded / avgBarProfit) : 0,
      loja: avgLojaProfit > 0 ? Math.ceil(amountNeeded / avgLojaProfit) : 0,
      mixed: avgBarProfit > 0 && avgLojaProfit > 0 ? 
        Math.ceil(amountNeeded / ((avgBarProfit * barSliderPercent) + (avgLojaProfit * lojaSliderPercent))) : 0
    }
  }

  // Função para calcular produtos necessários baseado no slider
  const getProductsNeededBySlider = () => {
    const amountNeeded = getAmountNeededToPay()
    if (amountNeeded <= 0) return []

    const barProducts = products.filter(p => p.category === 'bar')
    const lojaProducts = products.filter(p => p.category === 'loja')
    
    const barSliderPercent = (100 - barLojaSlider) / 100
    const lojaSliderPercent = barLojaSlider / 100
    
    const barAmountNeeded = amountNeeded * barSliderPercent
    const lojaAmountNeeded = amountNeeded * lojaSliderPercent
    
    const result = []
    
    // Calcular produtos do bar necessários
    barProducts.forEach(product => {
      const profit = product.salePrice - product.purchasePrice
      if (profit > 0) {
        const quantity = Math.ceil(barAmountNeeded / profit / barProducts.length)
        result.push({
          ...product,
          neededQuantity: quantity,
          neededRevenue: quantity * product.salePrice,
          neededProfit: quantity * profit
        })
      }
    })
    
    // Calcular produtos da loja necessários
    lojaProducts.forEach(product => {
      const profit = product.salePrice - product.purchasePrice
      if (profit > 0) {
        const quantity = Math.ceil(lojaAmountNeeded / profit / lojaProducts.length)
        result.push({
          ...product,
          neededQuantity: quantity,
          neededRevenue: quantity * product.salePrice,
          neededProfit: quantity * profit
        })
      }
    })
    
    return result
  }

  const themeClasses = darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'

  return (
    <div className={`min-h-screen transition-all duration-300 ${themeClasses}`}>
      <div className="max-w-7xl mx-auto p-2 sm:p-4 lg:p-6">
        {/* Header - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-8 gap-4">
          <div className="w-full sm:w-auto">
            <h1 className={`text-2xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent`}>
              EventControl Pro
            </h1>
            <p className={`text-sm sm:text-lg mt-1 sm:mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Gestão Completa de Eventos com Bar e Loja
            </p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            {/* Undo/Redo Buttons */}
            <button
              onClick={performUndo}
              disabled={undoHistory.length === 0}
              className={`p-2 sm:p-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg ${
                undoHistory.length === 0 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white hover:from-yellow-600 hover:to-orange-700'
              }`}
              title="Desfazer"
            >
              <Undo className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            
            <button
              onClick={performRedo}
              disabled={redoHistory.length === 0}
              className={`p-2 sm:p-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg ${
                redoHistory.length === 0 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700'
              }`}
              title="Refazer"
            >
              <Redo className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 sm:p-3 rounded-xl transition-all duration-300 hover:scale-105 ${
                darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-600'
              } shadow-lg`}
            >
              {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            
            <button
              onClick={() => setShowCalculator(!showCalculator)}
              className="p-2 sm:p-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 sm:p-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-300 hover:scale-105 shadow-lg relative"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold animate-pulse">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Mobile Optimized */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white/70'} backdrop-blur-sm rounded-2xl p-2 shadow-lg mb-4 sm:mb-8`}>
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'ingressos', label: 'Ingressos', icon: Ticket },
              { id: 'bar', label: 'Bar', icon: Coffee },
              { id: 'loja', label: 'Loja', icon: ShoppingCart },
              { id: 'relatorio', label: 'Relatório', icon: FileText }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-300 text-xs sm:text-sm ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : darkMode
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <tab.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 sm:space-y-8">
            {/* Summary Cards - Mobile Optimized */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-green-100 to-emerald-100'} p-3 sm:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`${darkMode ? 'text-emerald-400' : 'text-emerald-600'} font-medium flex items-center gap-1 sm:gap-2 text-xs sm:text-sm`}>
                      <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                      Receita Total
                    </p>
                    <p className={`text-lg sm:text-2xl font-bold ${darkMode ? 'text-emerald-300' : 'text-emerald-800'}`}>
                      {formatCurrency(getTotalRevenue())}
                    </p>
                  </div>
                  <div className={`${darkMode ? 'bg-emerald-900' : 'bg-emerald-200'} p-2 sm:p-3 rounded-full`}>
                    <TrendingUp className={`w-4 h-4 sm:w-6 sm:h-6 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`} />
                  </div>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-red-100 to-pink-100'} p-3 sm:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`${darkMode ? 'text-pink-400' : 'text-pink-600'} font-medium flex items-center gap-1 sm:gap-2 text-xs sm:text-sm`}>
                      <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
                      Investimento
                    </p>
                    <p className={`text-lg sm:text-2xl font-bold ${darkMode ? 'text-pink-300' : 'text-pink-800'}`}>
                      {formatCurrency(getTotalExpenses())}
                    </p>
                  </div>
                  <div className={`${darkMode ? 'bg-pink-900' : 'bg-pink-200'} p-2 sm:p-3 rounded-full`}>
                    <TrendingDown className={`w-4 h-4 sm:w-6 sm:h-6 ${darkMode ? 'text-pink-400' : 'text-pink-700'}`} />
                  </div>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-gray-800' : getNetProfit() >= 0 ? 'bg-gradient-to-br from-blue-100 to-cyan-100' : 'bg-gradient-to-br from-red-100 to-pink-100'} p-3 sm:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`${darkMode ? (getNetProfit() >= 0 ? 'text-cyan-400' : 'text-red-400') : (getNetProfit() >= 0 ? 'text-cyan-600' : 'text-red-600')} font-medium flex items-center gap-1 sm:gap-2 text-xs sm:text-sm`}>
                      <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                      {getNetProfit() >= 0 ? 'Lucro' : 'Falta Pagar'}
                    </p>
                    <p className={`text-lg sm:text-2xl font-bold ${getNetProfit() >= 0 ? (darkMode ? 'text-cyan-300' : 'text-cyan-800') : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(getNetProfit()))}
                    </p>
                  </div>
                  <div className={`${darkMode ? (getNetProfit() >= 0 ? 'bg-cyan-900' : 'bg-red-900') : (getNetProfit() >= 0 ? 'bg-cyan-200' : 'bg-red-200')} p-2 sm:p-3 rounded-full`}>
                    <DollarSign className={`w-4 h-4 sm:w-6 sm:h-6 ${darkMode ? (getNetProfit() >= 0 ? 'text-cyan-400' : 'text-red-400') : (getNetProfit() >= 0 ? 'text-cyan-700' : 'text-red-700')}`} />
                  </div>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-purple-100 to-violet-100'} p-3 sm:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`${darkMode ? 'text-violet-400' : 'text-violet-600'} font-medium flex items-center gap-1 sm:gap-2 text-xs sm:text-sm`}>
                      <Ticket className="w-3 h-3 sm:w-4 sm:h-4" />
                      Ingressos
                    </p>
                    <p className={`text-lg sm:text-2xl font-bold ${darkMode ? 'text-violet-300' : 'text-violet-800'}`}>
                      {formatNumber(ticketInfo.ticketsSold)}
                    </p>
                  </div>
                  <div className={`${darkMode ? 'bg-violet-900' : 'bg-violet-200'} p-2 sm:p-3 rounded-full`}>
                    <Ticket className={`w-4 h-4 sm:w-6 sm:h-6 ${darkMode ? 'text-violet-400' : 'text-violet-700'}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions - Mobile Optimized */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white/70'} backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg`}>
              <h3 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-3 sm:mb-4`}>Ações Rápidas</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4">
                <button
                  onClick={() => setActiveTab('ingressos')}
                  className="p-3 sm:p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg flex flex-col items-center gap-1 sm:gap-2"
                >
                  <Ticket className="w-4 h-4 sm:w-6 sm:h-6" />
                  <span className="text-xs sm:text-sm font-medium">Ingressos</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('bar')}
                  className="p-3 sm:p-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-300 hover:scale-105 shadow-lg flex flex-col items-center gap-1 sm:gap-2"
                >
                  <Coffee className="w-4 h-4 sm:w-6 sm:h-6" />
                  <span className="text-xs sm:text-sm font-medium">Bar</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('loja')}
                  className="p-3 sm:p-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 hover:scale-105 shadow-lg flex flex-col items-center gap-1 sm:gap-2"
                >
                  <ShoppingCart className="w-4 h-4 sm:w-6 sm:h-6" />
                  <span className="text-xs sm:text-sm font-medium">Loja</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('relatorio')}
                  className="p-3 sm:p-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 hover:scale-105 shadow-lg flex flex-col items-center gap-1 sm:gap-2"
                >
                  <FileText className="w-4 h-4 sm:w-6 sm:h-6" />
                  <span className="text-xs sm:text-sm font-medium">Relatórios</span>
                </button>
                
                <button
                  onClick={exportToPDF}
                  disabled={isExporting}
                  className="p-3 sm:p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 hover:scale-105 shadow-lg flex flex-col items-center gap-1 sm:gap-2 disabled:opacity-50"
                >
                  {isExporting ? <RefreshCw className="w-4 h-4 sm:w-6 sm:h-6 animate-spin" /> : <Download className="w-4 h-4 sm:w-6 sm:h-6" />}
                  <span className="text-xs sm:text-sm font-medium">Exportar</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ingressos Tab */}
        {activeTab === 'ingressos' && (
          <div className="space-y-4 sm:space-y-8">
            {/* Ticket Info Card - Mobile Optimized */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white/70'} backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg`}>
              <h3 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-3 sm:mb-4 flex items-center gap-2`}>
                <Ticket className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                Informações dos Ingressos
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                    Ticket Médio Atual
                  </label>
                  <input
                    type="number"
                    value={ticketInfo.currentTicketPrice}
                    onChange={(e) => setTicketInfo({ ...ticketInfo, currentTicketPrice: parseFloat(e.target.value) || 0 })}
                    className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm sm:text-base ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                    placeholder="50.00"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                    Ingressos Vendidos
                  </label>
                  <input
                    type="number"
                    value={ticketInfo.ticketsSold}
                    onChange={(e) => setTicketInfo({ ...ticketInfo, ticketsSold: parseInt(e.target.value) || 0 })}
                    className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm sm:text-base ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                    Custo Total do Evento
                  </label>
                  <input
                    type="number"
                    value={ticketInfo.eventTotalCost}
                    onChange={(e) => setTicketInfo({ ...ticketInfo, eventTotalCost: parseFloat(e.target.value) || 0 })}
                    className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm sm:text-base ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                    placeholder="15000.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-green-50'} p-4 rounded-xl`}>
                  <h4 className={`text-sm sm:text-lg font-semibold ${darkMode ? 'text-green-400' : 'text-green-600'} mb-2`}>Receita de Ingressos</h4>
                  <p className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                    {formatCurrency(ticketInfo.currentTicketPrice * ticketInfo.ticketsSold)}
                  </p>
                </div>
                
                <div className={`${darkMode ? 'bg-gray-700' : getAmountNeededToPay() > 0 ? 'bg-red-50' : 'bg-green-50'} p-4 rounded-xl`}>
                  <h4 className={`text-sm sm:text-lg font-semibold ${darkMode ? (getAmountNeededToPay() > 0 ? 'text-red-400' : 'text-green-400') : (getAmountNeededToPay() > 0 ? 'text-red-600' : 'text-green-600')} mb-2`}>
                    {getAmountNeededToPay() > 0 ? 'Falta para Pagar' : 'Evento Quitado'}
                  </h4>
                  <p className={`text-xl sm:text-2xl font-bold ${getAmountNeededToPay() > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(getAmountNeededToPay())}
                  </p>
                </div>
              </div>
            </div>

            {/* Strategy Slider - Mobile Optimized */}
            {getAmountNeededToPay() > 0 && (
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white/70'} backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg`}>
                <h3 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Estratégia de Vendas</h3>
                
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>Foco no Bar</span>
                    <span className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Foco na Loja</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={barLojaSlider}
                    onChange={(e) => setBarLojaSlider(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="text-center mt-2">
                    <span className={`text-xs sm:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {barLojaSlider < 25 ? 'Principalmente Bar' : 
                       barLojaSlider > 75 ? 'Principalmente Loja' : 'Estratégia Mista'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                  <div className={`${darkMode ? 'bg-gray-700' : 'bg-orange-50'} p-3 sm:p-4 rounded-xl text-center`}>
                    <h4 className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-orange-400' : 'text-orange-600'} mb-2`}>Só com Bar</h4>
                    <p className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-orange-300' : 'text-orange-700'}`}>
                      {formatNumber(getProductsNeededToPayEvent().bar)} produtos
                    </p>
                  </div>
                  
                  <div className={`${darkMode ? 'bg-gray-700' : 'bg-blue-50'} p-3 sm:p-4 rounded-xl text-center`}>
                    <h4 className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'} mb-2`}>Estratégia Mista</h4>
                    <p className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                      {formatNumber(getProductsNeededToPayEvent().mixed)} produtos
                    </p>
                  </div>
                  
                  <div className={`${darkMode ? 'bg-gray-700' : 'bg-purple-50'} p-3 sm:p-4 rounded-xl text-center`}>
                    <h4 className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-purple-400' : 'text-purple-600'} mb-2`}>Só com Loja</h4>
                    <p className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                      {formatNumber(getProductsNeededToPayEvent().loja)} produtos
                    </p>
                  </div>
                </div>

                {/* Detailed Product Strategy - Mobile Optimized */}
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-3 sm:p-4 rounded-xl`}>
                  <h4 className={`text-sm sm:text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4`}>
                    Produtos Necessários - {barLojaSlider < 25 ? 'Foco no Bar' : barLojaSlider > 75 ? 'Foco na Loja' : 'Estratégia Mista'}
                  </h4>
                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    {getProductsNeededBySlider().map((product) => (
                      <div key={product.id} className={`${darkMode ? 'bg-gray-600' : 'bg-white'} p-3 rounded-lg`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <h5 className={`font-medium text-sm sm:text-base ${darkMode ? 'text-white' : 'text-gray-800'}`}>{product.name}</h5>
                            <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {product.category === 'bar' ? '🍺' : '🛍️'} {product.category.toUpperCase()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold text-sm sm:text-base ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                              {formatNumber(product.neededQuantity)} unidades
                            </p>
                            <p className={`text-xs sm:text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                              {formatCurrency(product.neededRevenue)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <div className="flex justify-between items-center">
                      <span className={`font-semibold text-sm sm:text-base ${darkMode ? 'text-white' : 'text-gray-800'}`}>Total Necessário:</span>
                      <div className="text-right">
                        <p className={`text-base sm:text-lg font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                          {formatCurrency(getProductsNeededBySlider().reduce((sum, p) => sum + p.neededRevenue, 0))}
                        </p>
                        <p className={`text-xs sm:text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          Lucro: {formatCurrency(getProductsNeededBySlider().reduce((sum, p) => sum + p.neededProfit, 0))}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {getAmountNeededToPay() <= 0 && (
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white/70'} backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg text-center`}>
                <div className="text-4xl sm:text-6xl mb-4">🎉</div>
                <h3 className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'} mb-2`}>
                  Parabéns! Evento Quitado!
                </h3>
                <p className={`text-sm sm:text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Você já arrecadou o suficiente para cobrir todos os custos do evento.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Bar Tab - Mobile Optimized */}
        {activeTab === 'bar' && (
          <div className="space-y-4 sm:space-y-8">
            {/* Bar Investment Card */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white/70'} backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg`}>
              <h3 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-3 sm:mb-4 flex items-center gap-2`}>
                <Coffee className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                Total de Investimento no Bar
              </h3>
              <div className="text-2xl sm:text-3xl font-bold text-orange-600">
                {formatCurrency(getBarInvestment())}
              </div>
              <div className="mt-2 text-base sm:text-lg text-green-600 font-semibold">
                Receita Bruta Total: {formatCurrency(getBarGrossRevenue())}
              </div>
            </div>

            {/* Products Management - Mobile Optimized */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white/70'} backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg`}>
              <h3 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Produtos do Bar</h3>
              
              {/* Add Product Buttons - Mobile Optimized */}
              <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-6">
                <button
                  onClick={() => {
                    setNewProduct({ ...newProduct, category: 'bar', type: 'package' })
                    setShowCustomProductForm(true)
                  }}
                  className="p-3 sm:p-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                >
                  <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                  Adicionar Produtos por Pacote
                </button>
                
                <button
                  onClick={() => {
                    setNewProduct({ ...newProduct, category: 'bar', type: 'unit' })
                    setShowCustomProductForm(true)
                  }}
                  className="p-3 sm:p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  Adicionar Produtos por Unidade
                </button>
              </div>

              {/* Custom Product Form - Mobile Optimized */}
              {showCustomProductForm && (
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-3 sm:p-4 rounded-xl mb-6`}>
                  <h4 className={`text-base sm:text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4`}>
                    {newProduct.type === 'package' ? 'Produto por Pacote' : 'Produto Unitário'}
                  </h4>
                  
                  <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-4">
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                        Nome do Produto
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Cerveja Artesanal"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm sm:text-base ${
                          darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-200'
                        }`}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                          Custo (por unidade)
                        </label>
                        <input
                          type="number"
                          placeholder="3.50"
                          value={newProduct.purchasePrice}
                          onChange={(e) => setNewProduct({ ...newProduct, purchasePrice: e.target.value })}
                          className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm sm:text-base ${
                            darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-200'
                          }`}
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                          Valor de Venda (por unidade)
                        </label>
                        <input
                          type="number"
                          placeholder="8.00"
                          value={newProduct.salePrice}
                          onChange={(e) => setNewProduct({ ...newProduct, salePrice: e.target.value })}
                          className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm sm:text-base ${
                            darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-200'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {newProduct.type === 'package' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                      <div>
                        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                          Valor do Pacote
                        </label>
                        <input
                          type="number"
                          placeholder="84.00"
                          value={newProduct.packagePrice}
                          onChange={(e) => setNewProduct({ ...newProduct, packagePrice: e.target.value })}
                          className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm sm:text-base ${
                            darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-200'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                          Unidades no Pacote
                        </label>
                        <input
                          type="number"
                          placeholder="24"
                          value={newProduct.packageUnits}
                          onChange={(e) => setNewProduct({ ...newProduct, packageUnits: e.target.value })}
                          className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm sm:text-base ${
                            darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-200'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                          Estoque por Pacote
                        </label>
                        <input
                          type="number"
                          placeholder="8"
                          value={newProduct.packageQuantity}
                          onChange={(e) => setNewProduct({ ...newProduct, packageQuantity: e.target.value })}
                          className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm sm:text-base ${
                            darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-200'
                          }`}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-4">
                      <div>
                        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                          Quantidade em Estoque
                        </label>
                        <input
                          type="number"
                          placeholder="50"
                          value={newProduct.packageQuantity}
                          onChange={(e) => setNewProduct({ ...newProduct, packageQuantity: e.target.value })}
                          className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm sm:text-base ${
                            darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-200'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => {
                        setNewProduct({ ...newProduct, category: 'bar' })
                        addProduct()
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300"
                    >
                      Adicionar Produto
                    </button>
                    <button
                      onClick={() => setShowCustomProductForm(false)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-300"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Products Table - Mobile Optimized */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <th className={`p-2 sm:p-3 text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Produto</th>
                      <th className={`p-2 sm:p-3 text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Tipo</th>
                      <th className={`p-2 sm:p-3 text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Estoque Pacote</th>
                      <th className={`p-2 sm:p-3 text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Estoque Unidade</th>
                      <th className={`p-2 sm:p-3 text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Custo</th>
                      <th className={`p-2 sm:p-3 text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Valor Venda</th>
                      <th className={`p-2 sm:p-3 text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.filter(p => p.category === 'bar').map((product) => (
                      <tr key={product.id} className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <td className={`p-2 sm:p-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{product.name}</td>
                        <td className={`p-2 sm:p-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.type === 'package' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {product.type === 'package' ? 'Pacote' : 'Unitário'}
                          </span>
                        </td>
                        <td className={`p-2 sm:p-3 font-bold ${product.packageQuantity > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                          {formatNumber(product.packageQuantity)}
                        </td>
                        <td className={`p-2 sm:p-3 font-bold ${(product.quantity - product.sold) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatNumber(product.quantity - product.sold)}
                        </td>
                        <td className={`p-2 sm:p-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{formatCurrency(product.purchasePrice)}</td>
                        <td className={`p-2 sm:p-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{formatCurrency(product.salePrice)}</td>
                        <td className="p-2 sm:p-3">
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="p-1 sm:p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-300 hover:scale-105"
                            title="Excluir produto"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sales Section - Mobile Optimized */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white/70'} backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg`}>
              <h3 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Vendas Realizadas</h3>
              
              {/* Resumo Financeiro - Mobile Optimized */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-green-50'} p-3 sm:p-4 rounded-xl`}>
                  <h4 className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-green-400' : 'text-green-600'} mb-2`}>Receita Bruta</h4>
                  <p className={`text-sm sm:text-xl font-bold ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                    {formatCurrency(products.filter(p => p.category === 'bar').reduce((sum, p) => sum + (p.salePrice * p.sold), 0))}
                  </p>
                </div>
                
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-blue-50'} p-3 sm:p-4 rounded-xl`}>
                  <h4 className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'} mb-2`}>Receita Líquida</h4>
                  <p className={`text-sm sm:text-xl font-bold ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                    {formatCurrency(getNetRevenue('bar'))}
                  </p>
                </div>
                
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-yellow-50'} p-3 sm:p-4 rounded-xl col-span-2 lg:col-span-1`}>
                  <h4 className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-yellow-400' : 'text-yellow-600'} mb-2`}>Sobras em Reais</h4>
                  <p className={`text-sm sm:text-xl font-bold ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                    {formatCurrency(getSobraValue('bar'))}
                  </p>
                </div>
              </div>

              {/* Vendas por Pacote - Mobile Optimized */}
              <div className="mb-8">
                <h4 className={`text-base sm:text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Vendas por Pacote</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <th className={`p-2 sm:p-3 text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Produto</th>
                        <th className={`p-2 sm:p-3 text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Preço Unit.</th>
                        <th className={`p-2 sm:p-3 text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Pacotes Devolvidos</th>
                        <th className={`p-2 sm:p-3 text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Unidades Sobrou</th>
                        <th className={`p-2 sm:p-3 text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Receita Bruta</th>
                        <th className={`p-2 sm:p-3 text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Sobrou em Reais</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.filter(p => p.category === 'bar' && p.type === 'package').map((product) => {
                        const grossRevenue = product.salePrice * product.sold
                        const sobraValue = product.purchasePrice * (product.remainingUnits || 0)
                        
                        return (
                          <tr key={product.id} className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <td className={`p-2 sm:p-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{product.name}</td>
                            <td className={`p-2 sm:p-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{formatCurrency(product.salePrice)}</td>
                            <td className="p-2 sm:p-3">
                              <input
                                type="number"
                                value={product.returnedPackages || ''}
                                onChange={(e) => updateProductReturns(product.id, parseInt(e.target.value) || 0, product.remainingUnits || 0)}
                                min="0"
                                max={product.packageQuantity}
                                placeholder="0"
                                className={`w-16 sm:w-20 p-1 sm:p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-xs sm:text-sm ${
                                  darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 placeholder-gray-400'
                                }`}
                              />
                            </td>
                            <td className="p-2 sm:p-3">
                              <input
                                type="number"
                                value={product.remainingUnits || ''}
                                onChange={(e) => updateProductReturns(product.id, product.returnedPackages || 0, parseInt(e.target.value) || 0)}
                                min="0"
                                placeholder="0"
                                className={`w-16 sm:w-20 p-1 sm:p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-xs sm:text-sm ${
                                  darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 placeholder-gray-400'
                                }`}
                              />
                            </td>
                            <td className={`p-2 sm:p-3 font-bold text-green-600 text-xs sm:text-sm`}>{formatCurrency(grossRevenue)}</td>
                            <td className={`p-2 sm:p-3 font-bold text-yellow-600 text-xs sm:text-sm`}>{formatCurrency(sobraValue)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Vendas por Unidade - Mobile Optimized */}
              <div className="mb-6">
                <h4 className={`text-base sm:text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Vendas por Unidade</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <th className={`p-2 sm:p-3 text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Produto</th>
                        <th className={`p-2 sm:p-3 text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Preço Unit.</th>
                        <th className={`p-2 sm:p-3 text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Unidades Devolvidas</th>
                        <th className={`p-2 sm:p-3 text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Receita Bruta</th>
                        <th className={`p-2 sm:p-3 text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Sobrou em Reais</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.filter(p => p.category === 'bar' && p.type === 'unit').map((product) => {
                        const grossRevenue = product.salePrice * product.sold
                        const sobraValue = product.purchasePrice * (product.remainingUnits || 0)
                        
                        return (
                          <tr key={product.id} className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <td className={`p-2 sm:p-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{product.name}</td>
                            <td className={`p-2 sm:p-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{formatCurrency(product.salePrice)}</td>
                            <td className="p-2 sm:p-3">
                              <input
                                type="number"
                                value={product.returnedPackages || ''}
                                onChange={(e) => updateProductReturns(product.id, parseInt(e.target.value) || 0, product.remainingUnits || 0)}
                                min="0"
                                max={product.packageQuantity}
                                placeholder="0"
                                className={`w-16 sm:w-20 p-1 sm:p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-xs sm:text-sm ${
                                  darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 placeholder-gray-400'
                                }`}
                              />
                            </td>
                            <td className={`p-2 sm:p-3 font-bold text-green-600 text-xs sm:text-sm`}>{formatCurrency(grossRevenue)}</td>
                            <td className={`p-2 sm:p-3 font-bold text-yellow-600 text-xs sm:text-sm`}>{formatCurrency(sobraValue)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 text-right">
                <span className={`text-sm sm:text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Receita Total do Bar: <span className="text-green-600">{formatCurrency(getBarRevenue())}</span>
                </span>
              </div>
            </div>

            {/* Bar Summary Card - Mobile Optimized */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white/70'} backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg`}>
              <h3 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Resumo do Bar</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-orange-600 mb-2">
                    {formatCurrency(getBarProfit())}
                  </div>
                  <div className={`text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Lucro do Bar</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">
                    {getBarMargin().toFixed(1)}%
                  </div>
                  <div className={`text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Margem de Lucro</div>
                </div>
                <div className="text-center">
                  <div className={`w-16 h-16 sm:w-24 sm:h-24 mx-auto rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold ${
                    getBarProfit() >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {getBarProfit() >= 0 ? '📈' : '📉'}
                  </div>
                  <div className={`mt-2 text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Performance</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loja Tab - Mobile Optimized */}
        {activeTab === 'loja' && (
          <div className="space-y-4 sm:space-y-8">
            {/* Similar structure to Bar but for Loja - Mobile Optimized */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white/70'} backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg`}>
              <h3 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-3 sm:mb-4 flex items-center gap-2`}>
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                Total de Investimento na Loja
              </h3>
              <div className="text-2xl sm:text-3xl font-bold text-purple-600">
                {formatCurrency(getLojaInvestment())}
              </div>
              <div className="mt-2 text-base sm:text-lg text-green-600 font-semibold">
                Receita Bruta Total: {formatCurrency(products.filter(p => p.category === 'loja').reduce((sum, p) => sum + (p.salePrice * p.sold), 0))}
              </div>
            </div>

            {/* Products Management for Loja - Mobile Optimized */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white/70'} backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg`}>
              <h3 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Produtos da Loja</h3>
              
              {/* Add Product Form - Mobile Optimized */}
              <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Nome do produto"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className={`p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm sm:text-base ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                  }`}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Valor do produto (custo)"
                    value={newProduct.packagePrice}
                    onChange={(e) => setNewProduct({ ...newProduct, packagePrice: e.target.value })}
                    className={`p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm sm:text-base ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                  />
                  <input
                    type="number"
                    placeholder="Valor da venda"
                    value={newProduct.salePrice}
                    onChange={(e) => setNewProduct({ ...newProduct, salePrice: e.target.value })}
                    className={`p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm sm:text-base ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Estoque (unidades)"
                    value={newProduct.packageQuantity}
                    onChange={(e) => setNewProduct({ ...newProduct, packageQuantity: e.target.value })}
                    className={`p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm sm:text-base ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                  />
                  <button
                    onClick={() => {
                      setNewProduct({ 
                        ...newProduct, 
                        category: 'loja', 
                        type: 'unit',
                        packageUnits: '1',
                        purchasePrice: newProduct.packagePrice // Use packagePrice as purchasePrice for loja
                      })
                      addProduct()
                    }}
                    className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </button>
                </div>
              </div>

              {/* Products Table - Mobile Optimized */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <th className={`p-2 sm:p-3 text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Produto</th>
                      <th className={`p-2 sm:p-3 text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Valor do Produto</th>
                      <th className={`p-2 sm:p-3 text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Valor da Venda</th>
                      <th className={`p-2 sm:p-3 text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Estoque (unidades)</th>
                      <th className={`p-2 sm:p-3 text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.filter(p => p.category === 'loja').map((product) => (
                      <tr key={product.id} className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <td className={`p-2 sm:p-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{product.name}</td>
                        <td className={`p-2 sm:p-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{formatCurrency(product.packagePrice)}</td>
                        <td className={`p-2 sm:p-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{formatCurrency(product.salePrice)}</td>
                        <td className={`p-2 sm:p-3 font-bold ${product.packageQuantity > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                          {formatNumber(product.packageQuantity)}
                        </td>
                        <td className="p-2 sm:p-3">
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="p-1 sm:p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-300 hover:scale-105"
                            title="Excluir produto"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sales Section for Loja - Mobile Optimized */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white/70'} backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg`}>
              <h3 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Vendas Realizadas</h3>
              
              {/* Resumo Financeiro - Mobile Optimized */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-green-50'} p-3 sm:p-4 rounded-xl`}>
                  <h4 className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-green-400' : 'text-green-600'} mb-2`}>Receita Bruta</h4>
                  <p className={`text-sm sm:text-xl font-bold ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                    {formatCurrency(products.filter(p => p.category === 'loja').reduce((sum, p) => sum + (p.salePrice * p.sold), 0))}
                  </p>
                </div>
                
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-blue-50'} p-3 sm:p-4 rounded-xl`}>
                  <h4 className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'} mb-2`}>Receita Líquida</h4>
                  <p className={`text-sm sm:text-xl font-bold ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                    {formatCurrency(getNetRevenue('loja'))}
                  </p>
                </div>
                
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-yellow-50'} p-3 sm:p-4 rounded-xl col-span-2 lg:col-span-1`}>
                  <h4 className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-yellow-400' : 'text-yellow-600'} mb-2`}>Sobras em Reais</h4>
                  <p className={`text-sm sm:text-xl font-bold ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                    {formatCurrency(getSobraValue('loja'))}
                  </p>
                </div>
              </div>

              {/* Sales Table - Mobile Optimized */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <th className={`p-2 sm:p-3 text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Produto</th>
                      <th className={`p-2 sm:p-3 text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Preço Unit.</th>
                      <th className={`p-2 sm:p-3 text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Quantidade Devolvida</th>
                      <th className={`p-2 sm:p-3 text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Faturamento Bruto</th>
                      <th className={`p-2 sm:p-3 text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Valor em Produtos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.filter(p => p.category === 'loja').map((product) => {
                      const grossRevenue = product.salePrice * product.sold
                      const productValue = product.packagePrice * product.sold
                      
                      return (
                        <tr key={product.id} className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                          <td className={`p-2 sm:p-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{product.name}</td>
                          <td className={`p-2 sm:p-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{formatCurrency(product.salePrice)}</td>
                          <td className="p-2 sm:p-3">
                            <input
                              type="number"
                              value={product.returnedPackages || ''}
                              onChange={(e) => updateProductReturns(product.id, parseInt(e.target.value) || 0, product.remainingUnits || 0)}
                              min="0"
                              max={product.packageQuantity}
                              placeholder="0"
                              className={`w-16 sm:w-20 p-1 sm:p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-xs sm:text-sm ${
                                darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 placeholder-gray-400'
                              }`}
                            />
                          </td>
                          <td className={`p-2 sm:p-3 font-bold text-green-600 text-xs sm:text-sm`}>{formatCurrency(grossRevenue)}</td>
                          <td className={`p-2 sm:p-3 font-bold text-blue-600 text-xs sm:text-sm`}>{formatCurrency(productValue)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-right">
                <span className={`text-sm sm:text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Total de Receitas da Loja: <span className="text-green-600">{formatCurrency(getLojaRevenue())}</span>
                </span>
              </div>
            </div>

            {/* Loja Summary Card - Mobile Optimized */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white/70'} backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg`}>
              <h3 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Resumo da Loja</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-2">
                    {formatCurrency(getLojaProfit())}
                  </div>
                  <div className={`text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Lucro da Loja</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">
                    {getLojaMargin().toFixed(1)}%
                  </div>
                  <div className={`text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Margem de Lucro</div>
                </div>
                <div className="text-center">
                  <div className={`w-16 h-16 sm:w-24 sm:h-24 mx-auto rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold ${
                    getLojaProfit() >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {getLojaProfit() >= 0 ? '🛍️' : '📉'}
                  </div>
                  <div className={`mt-2 text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Performance</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Relatório Tab - Mobile Optimized */}
        {activeTab === 'relatorio' && (
          <div className="space-y-4 sm:space-y-8">
            {/* Receitas Totais Card - Mobile Optimized */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white/70'} backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg`}>
              <h3 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-3 sm:mb-4 flex items-center gap-2`}>
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                Receitas Totais
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={`text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Bar:</span>
                  <span className="font-bold text-green-600 text-sm sm:text-base">{formatCurrency(getBarRevenue())}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loja:</span>
                  <span className="font-bold text-green-600 text-sm sm:text-base">{formatCurrency(getLojaRevenue())}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Ingressos:</span>
                  <span className="font-bold text-green-600 text-sm sm:text-base">{formatCurrency(ticketInfo.currentTicketPrice * ticketInfo.ticketsSold)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Outras Receitas:</span>
                  <span className="font-bold text-green-600 text-sm sm:text-base">{formatCurrency(revenues.reduce((sum, rev) => sum + rev.amount, 0))}</span>
                </div>
                <hr className={`${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                <div className="flex justify-between items-center text-base sm:text-lg">
                  <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Total Geral:</span>
                  <span className="font-bold text-green-600 text-lg sm:text-xl">{formatCurrency(getTotalRevenue())}</span>
                </div>
              </div>
            </div>

            {/* Gastos Totais Card - Mobile Optimized */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white/70'} backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg`}>
              <h3 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-3 sm:mb-4 flex items-center gap-2`}>
                <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                Gastos Totais
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={`text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Investimento Bar:</span>
                  <span className="font-bold text-red-600 text-sm sm:text-base">{formatCurrency(getBarInvestment())}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Investimento Loja:</span>
                  <span className="font-bold text-red-600 text-sm sm:text-base">{formatCurrency(getLojaInvestment())}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Custo do Evento:</span>
                  <span className="font-bold text-red-600 text-sm sm:text-base">{formatCurrency(ticketInfo.eventTotalCost)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Outras Despesas:</span>
                  <span className="font-bold text-red-600 text-sm sm:text-base">{formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0) + expenseCategories.reduce((sum, category) => sum + category.items.reduce((catSum, item) => catSum + item.amount, 0), 0))}</span>
                </div>
                <hr className={`${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                <div className="flex justify-between items-center text-base sm:text-lg">
                  <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Total Geral:</span>
                  <span className="font-bold text-red-600 text-lg sm:text-xl">{formatCurrency(getTotalExpenses())}</span>
                </div>
              </div>
            </div>

            {/* Resultado Final Card - Mobile Optimized */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white/70'} backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg`}>
              <h3 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-3 sm:mb-4 flex items-center gap-2`}>
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                Resultado Final
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="text-center">
                  <div className={`text-2xl sm:text-4xl font-bold mb-2 ${getNetProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(getNetProfit())}
                  </div>
                  <div className={`text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {getNetProfit() >= 0 ? 'Lucro' : 'Prejuízo'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-4xl font-bold text-blue-600 mb-2">
                    {getTotalRevenue() > 0 ? ((getNetProfit() / getTotalRevenue()) * 100).toFixed(1) : 0}%
                  </div>
                  <div className={`text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Margem de Lucro</div>
                </div>
                <div className="text-center">
                  <div className={`w-20 h-20 sm:w-32 sm:h-32 mx-auto rounded-full flex items-center justify-center text-2xl sm:text-4xl ${
                    getNetProfit() >= 0 ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {getNetProfit() >= 0 ? '🎉' : '😔'}
                  </div>
                  <div className={`mt-2 text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Status Geral</div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button
                onClick={exportToPDF}
                disabled={isExporting}
                className="px-4 sm:px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isExporting ? <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Download className="w-4 h-4 sm:w-5 sm:h-5" />}
                Exportar PDF
              </button>
              
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'EventControl Pro - Relatório',
                      text: `Lucro: ${formatCurrency(getNetProfit())} | Margem: ${getTotalRevenue() > 0 ? ((getNetProfit() / getTotalRevenue()) * 100).toFixed(1) : 0}%`,
                      url: window.location.href
                    })
                  } else {
                    addNotification('info', 'Compartilhar', 'Funcionalidade de compartilhamento não disponível neste navegador')
                  }
                }}
                className="px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                Compartilhar
              </button>
              
              <button
                onClick={() => {
                  const eventData = {
                    name: `Evento ${new Date().toLocaleDateString('pt-BR')}`,
                    summary: {
                      revenue: getTotalRevenue(),
                      expenses: getTotalExpenses(),
                      profit: getNetProfit()
                    },
                    products: products.length,
                    sales: sales.length
                  }
                  localStorage.setItem(`saved-event-${Date.now()}`, JSON.stringify(eventData))
                  addNotification('success', 'Evento Salvo', 'Evento foi salvo com sucesso!')
                }}
                className="px-4 sm:px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                Salvar Evento
              </button>
            </div>
          </div>
        )}

        {/* Floating Action Button - Mobile Optimized */}
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
          <div className="relative">
            {showFloatingMenu && (
              <div className="absolute bottom-12 sm:bottom-16 right-0 space-y-2">
                <button
                  onClick={() => {
                    setActiveTab('bar')
                    setShowFloatingMenu(false)
                  }}
                  className="block p-2 sm:p-3 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 transition-all duration-300"
                  title="Adicionar ao Bar"
                >
                  <Coffee className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => {
                    setActiveTab('loja')
                    setShowFloatingMenu(false)
                  }}
                  className="block p-2 sm:p-3 bg-purple-500 text-white rounded-full shadow-lg hover:bg-purple-600 transition-all duration-300"
                  title="Adicionar à Loja"
                >
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => {
                    setActiveTab('ingressos')
                    setShowFloatingMenu(false)
                  }}
                  className="block p-2 sm:p-3 bg-indigo-500 text-white rounded-full shadow-lg hover:bg-indigo-600 transition-all duration-300"
                  title="Gerenciar Ingressos"
                >
                  <Ticket className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => {
                    // Simulate camera functionality
                    addNotification('info', 'Câmera', 'Funcionalidade de câmera será implementada em breve!')
                    setShowFloatingMenu(false)
                  }}
                  className="block p-2 sm:p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-all duration-300"
                  title="Fotografar Nota Fiscal"
                >
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            )}
            
            <button
              onClick={() => setShowFloatingMenu(!showFloatingMenu)}
              className={`p-3 sm:p-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full shadow-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-300 hover:scale-110 ${
                showFloatingMenu ? 'rotate-45' : ''
              }`}
            >
              <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Calculator Modal - Mobile Optimized */}
        {showCalculator && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-4 sm:p-6 w-full max-w-sm`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Calculadora</h3>
                <button
                  onClick={() => setShowCalculator(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} p-3 sm:p-4 rounded-xl mb-4`}>
                <div className={`text-right text-xl sm:text-2xl font-mono ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {calculatorValue || '0'}
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {['C', '←', '/', '*', '7', '8', '9', '-', '4', '5', '6', '+', '1', '2', '3', '=', '0', '.'].map((btn) => (
                  <button
                    key={btn}
                    onClick={() => handleCalculatorInput(btn)}
                    className={`p-2 sm:p-3 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                      btn === '=' 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white col-span-2' 
                        : btn === '0'
                        ? 'col-span-2 bg-gray-200 hover:bg-gray-300 text-gray-800'
                        : darkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                  >
                    {btn}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Notifications Dropdown - Mobile Optimized */}
        {showNotifications && (
          <div className="fixed top-16 sm:top-20 right-2 sm:right-4 w-80 max-w-[calc(100vw-1rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Notificações</h3>
            </div>
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                Nenhuma notificação
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 sm:p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                    onClick={() => {
                      setNotifications(notifications.map(n => 
                        n.id === notification.id ? { ...n, read: true } : n
                      ))
                    }}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className={`p-1 rounded-full ${
                        notification.type === 'success' ? 'bg-green-100' :
                        notification.type === 'warning' ? 'bg-yellow-100' :
                        notification.type === 'error' ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        {notification.type === 'success' && <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />}
                        {notification.type === 'warning' && <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" />}
                        {notification.type === 'error' && <X className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />}
                        {notification.type === 'info' && <Bell className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 text-xs sm:text-sm">{notification.title}</h4>
                        <p className="text-gray-600 text-xs mt-1">{notification.message}</p>
                        <p className="text-gray-400 text-xs mt-1">
                          {notification.timestamp.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}