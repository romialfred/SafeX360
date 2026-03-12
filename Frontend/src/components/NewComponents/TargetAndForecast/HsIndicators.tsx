import {
    IconActivity,
    IconChartBar,
    IconEdit,
    IconEye,
    IconPlus,
    IconSearch,
    IconTarget,
    IconTrash,
    IconTrendingUp,
    IconUsers,
    IconX,
} from "@tabler/icons-react";
import { useState } from "react";
interface HealthSafetyIndicator {
    id: string;
    name: string;
    definition: string;
    category: 'Leading' | 'Lagging' | 'Community';
    frequency: 'Monthly' | 'Quarterly' | 'Annual';
    hasForecast: boolean;
    unit: string;
    createdDate: string;
    isActive: boolean;
}

const mockIndicators: HealthSafetyIndicator[] = [
    {
        id: 'LTIFR',
        name: 'Lost Time Injury Frequency Rate',
        definition: 'Number of lost time injuries per 200,000 hours worked',
        category: 'Lagging',
        frequency: 'Monthly',
        hasForecast: true,
        unit: 'per 200,000 hours',
        createdDate: '2024-01-01',
        isActive: true
    },
    {
        id: 'TRIR',
        name: 'Total Recordable Incident Rate',
        definition: 'Total number of recordable incidents per 200,000 hours worked',
        category: 'Lagging',
        frequency: 'Monthly',
        hasForecast: true,
        unit: 'per 200,000 hours',
        createdDate: '2024-01-01',
        isActive: true
    },
    {
        id: 'NEAR_MISS',
        name: 'Near Miss Reporting Rate',
        definition: 'Number of near miss reports submitted per month',
        category: 'Leading',
        frequency: 'Monthly',
        hasForecast: true,
        unit: 'reports/month',
        createdDate: '2024-01-01',
        isActive: true
    },
    {
        id: 'TRAINING_COMP',
        name: 'Safety Training Completion',
        definition: 'Percentage of employees who completed mandatory safety training',
        category: 'Leading',
        frequency: 'Quarterly',
        hasForecast: true,
        unit: '%',
        createdDate: '2024-01-01',
        isActive: true
    },
    {
        id: 'COMMUNITY_ENG',
        name: 'Community Engagement Score',
        definition: 'Score measuring community involvement in safety initiatives',
        category: 'Community',
        frequency: 'Quarterly',
        hasForecast: false,
        unit: 'score (1-10)',
        createdDate: '2024-01-01',
        isActive: true
    }
];

const HsIndicators = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedYear, setSelectedYear] = useState<number>(2024);
    const [showAddIndicator, setShowAddIndicator] = useState(false);
    const years = [2022, 2023, 2024, 2025, 2026];
    const categories = ['all', 'Leading', 'Lagging', 'Community'];
    const frequencies = ['Monthly', 'Quarterly', 'Annual'];
    const [indicators, setIndicators] = useState<HealthSafetyIndicator[]>(mockIndicators);
    const [newIndicator, setNewIndicator] = useState<Partial<HealthSafetyIndicator>>({
        category: 'Leading',
        frequency: 'Monthly',
        hasForecast: true,
        isActive: true
    });
    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Leading': return <IconTrendingUp className="w-4 h-4" />;
            case 'Lagging': return <IconChartBar className="w-4 h-4" />;
            case 'Community': return <IconUsers className="w-4 h-4" />;
            default: return <IconActivity className="w-4 h-4" />;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'Leading': return 'bg-green-100 text-green-800 border-green-200';
            case 'Lagging': return 'bg-red-100 text-red-800 border-red-200';
            case 'Community': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const handleAddIndicator = () => {
        if (!newIndicator.name || !newIndicator.definition) return;

        const indicator: HealthSafetyIndicator = {
            id: newIndicator.name?.replace(/\s+/g, '_').toUpperCase() || '',
            name: newIndicator.name || '',
            definition: newIndicator.definition || '',
            category: newIndicator.category || 'Leading',
            frequency: newIndicator.frequency || 'Monthly',
            hasForecast: newIndicator.hasForecast || false,
            unit: newIndicator.unit || '',
            createdDate: new Date().toISOString().split('T')[0],
            isActive: true
        };

        setIndicators([...indicators, indicator]);
        setNewIndicator({
            category: 'Leading',
            frequency: 'Monthly',
            hasForecast: true,
            isActive: true
        });
        setShowAddIndicator(false);
    };
    const filteredIndicators = indicators.filter(indicator => {
        const matchesSearch = indicator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            indicator.definition.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || indicator.category === selectedCategory;
        return matchesSearch && matchesCategory && indicator.isActive;
    });

    return (
        <div>
            <div className="space-y-6">
                {/* Filters and Controls */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="relative">
                            <IconSearch className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher indicateurs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">Toutes Catégories</option>
                            {categories.slice(1).map(category => (
                                <option key={category} value={category}>{category} Indicators</option>
                            ))}
                        </select>

                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {years.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>

                        <button
                            onClick={() => setShowAddIndicator(true)}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <IconPlus className="w-4 h-4 mr-2" />
                            Ajouter Indicateur
                        </button>
                    </div>
                </div>

                {/* Add Indicator Form */}
                {showAddIndicator && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-gray-900">Nouvel Indicateur</h3>
                            <button
                                onClick={() => setShowAddIndicator(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <IconX className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nom de l'Indicateur *
                                </label>
                                <input
                                    type="text"
                                    value={newIndicator.name || ''}
                                    onChange={(e) => setNewIndicator(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Ex: Taux d'accidents du travail"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Unité de Mesure
                                </label>
                                <input
                                    type="text"
                                    value={newIndicator.unit || ''}
                                    onChange={(e) => setNewIndicator(prev => ({ ...prev, unit: e.target.value }))}
                                    placeholder="Ex: %, nombre, ratio"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Définition *
                                </label>
                                <textarea
                                    value={newIndicator.definition || ''}
                                    onChange={(e) => setNewIndicator(prev => ({ ...prev, definition: e.target.value }))}
                                    placeholder="Définition complète de l'indicateur"
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Catégorie *
                                </label>
                                <select
                                    value={newIndicator.category || 'Leading'}
                                    onChange={(e) => setNewIndicator(prev => ({ ...prev, category: e.target.value as any }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="Leading">Leading Indicators</option>
                                    <option value="Lagging">Lagging Indicators</option>
                                    <option value="Community">Community Indicators</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Fréquence *
                                </label>
                                <select
                                    value={newIndicator.frequency || 'Monthly'}
                                    onChange={(e) => setNewIndicator(prev => ({ ...prev, frequency: e.target.value as any }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {frequencies.map(freq => (
                                        <option key={freq} value={freq}>{freq}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="hasForecast"
                                        checked={newIndicator.hasForecast || false}
                                        onChange={(e) => setNewIndicator(prev => ({ ...prev, hasForecast: e.target.checked }))}
                                        className="mr-2"
                                    />
                                    <label htmlFor="hasForecast" className="text-sm text-gray-700">
                                        Cet indicateur a une prévision
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                            <button
                                onClick={() => setShowAddIndicator(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleAddIndicator}
                                disabled={!newIndicator.name || !newIndicator.definition}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Ajouter Indicateur
                            </button>
                        </div>
                    </div>
                )}

                {/* Indicators by Category */}
                {categories.slice(1).map(category => {
                    const categoryIndicators = filteredIndicators.filter(ind => ind.category === category);
                    if (categoryIndicators.length === 0 && selectedCategory !== 'all' && selectedCategory !== category) return null;

                    return (
                        <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center mb-6">
                                <div className={`p-2 rounded-lg mr-3 ${getCategoryColor(category)}`}>
                                    {getCategoryIcon(category)}
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900">{category} Indicators</h3>
                                <span className="ml-3 px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                                    {categoryIndicators.length}
                                </span>
                            </div>

                            {categoryIndicators.length > 0 ? (
                                <div className="space-y-4">
                                    {categoryIndicators.map(indicator => (
                                        <div key={indicator.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center mb-2">
                                                        <h4 className="text-lg font-medium text-gray-900 mr-3">{indicator.name}</h4>
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(indicator.category)}`}>
                                                            {getCategoryIcon(indicator.category)}
                                                            <span className="ml-1">{indicator.category}</span>
                                                        </span>
                                                        {indicator.hasForecast && (
                                                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                                                <IconTarget className="w-3 h-3 mr-1" />
                                                                Prévision
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-600 mb-2">{indicator.definition}</p>
                                                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                                                        <span>Fréquence: {indicator.frequency}</span>
                                                        <span>Unité: {indicator.unit}</span>
                                                        <span>Créé: {indicator.createdDate}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2 ml-4">
                                                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                        <IconEye className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                                                        <IconEdit className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                        <IconTrash className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="text-gray-400 mb-2">{getCategoryIcon(category)}</div>
                                    <p className="text-gray-500">Aucun indicateur {category.toLowerCase()} trouvé</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    )
}

export default HsIndicators