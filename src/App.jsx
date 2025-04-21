import { useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  Clock, 
  Users, 
  DollarSign, 
  FileText, 
  Plus, 
  Calendar, 
  Trash2, 
  RefreshCw 
} from 'lucide-react';

function App() {
  const [activity, setActivity] = useState({
    startHour: '',
    startMinute: '',
    endHour: '',
    endMinute: '',
    hourlyRate: ''
  });

  const [people, setPeople] = useState([]);
  const [newPerson, setNewPerson] = useState({ 
    name: '', 
    joinHour: '', 
    joinMinute: '',
    leaveHour: '',
    leaveMinute: ''
  });

  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({ 
    description: '', 
    amount: '' 
  });

  const [splitMode, setSplitMode] = useState('equal');

  const timeToMinutes = (hour, minute) => {
    const h = parseInt(hour, 10) || 0;
    const m = parseInt(minute, 10) || 0;
    return h * 60 + m;
  };

  const isValidTime = (hour, minute) => {
    const h = parseInt(hour, 10);
    const m = parseInt(minute, 10);
    return !isNaN(h) && h >= 0 && h <= 23 && !isNaN(m) && m >= 0 && m <= 59;
  };

  const calculateTotalMinutes = () => {
    if (!isValidTime(activity.startHour, activity.startMinute) || 
        !isValidTime(activity.endHour, activity.endMinute)) {
      return 0;
    }
    const startTime = timeToMinutes(activity.startHour, activity.startMinute);
    const endTime = timeToMinutes(activity.endHour, activity.endMinute);
    return endTime >= startTime ? endTime - startTime : 0;
  };

  const updateActivity = () => {
    const totalMinutes = calculateTotalMinutes();
    const hourlyRate = parseFloat(activity.hourlyRate) || 0;

    if (!activity.startHour || !activity.startMinute || !activity.endHour || !activity.endMinute) {
      toast.error('Vui lòng nhập đầy đủ thời gian bắt đầu và kết thúc!');
      return;
    }

    if (totalMinutes <= 0) {
      toast.error('Thời gian kết thúc phải sau thời gian bắt đầu!');
      return;
    }

    if (hourlyRate <= 0) {
      toast.error('Số tiền mỗi giờ phải lớn hơn 0!');
      return;
    }

    toast.success('Cập nhật thông tin hoạt động thành công!');
  };

  const addPerson = () => {
    const { name, joinHour, joinMinute, leaveHour, leaveMinute } = newPerson;
    const totalMinutes = calculateTotalMinutes();

    if (!totalMinutes) {
      toast.error('Vui lòng nhập thông tin hoạt động trước!');
      return;
    }

    if (!name.trim()) {
      toast.error('Vui lòng nhập tên người tham gia!');
      return;
    }

    if (people.some(p => p.name === name.trim())) {
      toast.error('Tên người tham gia đã tồn tại!');
      return;
    }

    if (!isValidTime(joinHour, joinMinute) || !isValidTime(leaveHour, leaveMinute)) {
      toast.error('Thời gian tham gia hoặc rời không hợp lệ!');
      return;
    }

    const joinTime = timeToMinutes(joinHour, joinMinute);
    const leaveTime = timeToMinutes(leaveHour, leaveMinute);
    const startTime = timeToMinutes(activity.startHour, activity.startMinute);
    const endTime = timeToMinutes(activity.endHour, activity.endMinute);

    if (joinTime < startTime || joinTime > endTime || leaveTime < joinTime || leaveTime > endTime) {
      toast.error('Thời gian tham gia/rời phải trong khoảng thời gian hoạt động!');
      return;
    }

    setPeople([...people, { 
      name: name.trim(), 
      joinHour, 
      joinMinute,
      leaveHour,
      leaveMinute,
      joinTimeValue: joinTime,
      leaveTimeValue: leaveTime
    }]);

    setNewPerson({ name: '', joinHour: '', joinMinute: '', leaveHour: '', leaveMinute: '' });
    toast.success(`Đã thêm ${name.trim()}!`);
  };

  const removePerson = (index) => {
    const personName = people[index].name;
    setPeople(people.filter((_, i) => i !== index));
    toast.success(`Đã xóa ${personName}!`);
  };

  const addExpense = () => {
    const { description, amount } = newExpense;
    if (!description.trim()) {
      toast.error('Vui lòng nhập mô tả khoản chi!');
      return;
    }

    const amountValue = parseFloat(amount);
    if (!amount || amountValue <= 0) {
      toast.error('Số tiền phải lớn hơn 0!');
      return;
    }

    setExpenses([...expenses, { 
      description: description.trim(),
      amount: Math.round(amountValue)
    }]);

    setNewExpense({ description: '', amount: '' });
    toast.success('Đã thêm khoản chi!');
  };

  const removeExpense = (index) => {
    const expDescription = expenses[index].description;
    setExpenses(expenses.filter((_, i) => i !== index));
    toast.success(`Đã xóa khoản chi ${expDescription}!`);
  };

  const calculateContributions = () => {
    const totalMinutes = calculateTotalMinutes();
    const hourlyRate = parseFloat(activity.hourlyRate) || 0;
    const totalActivityCost = Math.round(totalMinutes * (hourlyRate / 60));

    if (!totalMinutes || !hourlyRate || people.length === 0) {
      return [];
    }

    // Calculate total participation minutes
    const totalParticipationMinutes = people.reduce((sum, person) => {
      const minutes = person.leaveTimeValue - person.joinTimeValue;
      return sum + (minutes > 0 ? minutes : 0);
    }, 0);

    // Calculate individual participation costs based on proportion of time
    let individualCosts = people.map(person => {
      const minutesParticipated = person.leaveTimeValue - person.joinTimeValue;
      const proportion = totalParticipationMinutes > 0 ? minutesParticipated / totalParticipationMinutes : 0;
      let participationCost = minutesParticipated > 0 ? Math.round(proportion * totalActivityCost) : 0;
      return { 
        person: person.name, 
        minutes: minutesParticipated, 
        hours: minutesParticipated / 60, 
        participationCost 
      };
    });

    // Adjust participation costs to match totalActivityCost exactly
    let totalParticipationCost = individualCosts.reduce((sum, ic) => sum + ic.participationCost, 0);
    let remainingDiff = totalActivityCost - totalParticipationCost;
    let index = 0;
    while (remainingDiff !== 0 && index < individualCosts.length) {
      if (individualCosts[index].minutes > 0) {
        individualCosts[index].participationCost += remainingDiff > 0 ? 1 : -1;
        remainingDiff += remainingDiff > 0 ? -1 : 1;
      }
      index++;
    }

    // Active participants (those with participation time > 0)
    const activePeople = individualCosts.filter(ic => ic.minutes > 0);

    // Calculate shared expenses
    const totalSharedExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    let sharedPerPerson = [];

    if (splitMode === 'equal' && totalSharedExpense > 0) {
      // Equal split among active participants
      const perPerson = activePeople.length > 0 ? Math.round(totalSharedExpense / activePeople.length) : 0;
      sharedPerPerson = individualCosts.map(ic => ({
        person: ic.person,
        shared: ic.minutes > 0 ? perPerson : 0
      }));
    } else if (splitMode === 'proportional' && totalSharedExpense > 0) {
      // Proportional split based on participation minutes
      let remainingExpense = totalSharedExpense;
      sharedPerPerson = individualCosts.map(ic => {
        if (ic.minutes <= 0) return { person: ic.person, shared: 0 };
        const proportion = totalParticipationMinutes > 0 ? ic.minutes / totalParticipationMinutes : 0;
        const shared = Math.floor(proportion * totalSharedExpense);
        remainingExpense -= shared;
        return { person: ic.person, shared };
      });

      // Distribute remaining expense to active participants
      index = 0;
      while (remainingExpense > 0 && index < activePeople.length) {
        const person = sharedPerPerson.find(sp => sp.person === activePeople[index].person);
        if (person) {
          person.shared += 1;
          remainingExpense -= 1;
        }
        index++;
      }
    } else {
      // No shared expenses
      sharedPerPerson = individualCosts.map(ic => ({ person: ic.person, shared: 0 }));
    }

    // Combine participation and shared costs
    let contributions = individualCosts.map(({ person, minutes, hours, participationCost }) => {
      const shared = sharedPerPerson.find(sp => sp.person === person).shared;
      const totalContribution = participationCost + shared;
      return {
        person,
        hoursParticipated: hours,
        participationCost,
        shared,
        totalContribution
      };
    });

    // Verify total contributions match expected total
    const totalContributions = contributions.reduce((sum, item) => sum + item.totalContribution, 0);
    const expectedTotal = totalActivityCost + totalSharedExpense;
    if (Math.abs(totalContributions - expectedTotal) > 0) {
      remainingDiff = expectedTotal - totalContributions;
      index = 0;
      while (remainingDiff !== 0 && index < contributions.length) {
        if (contributions[index].hoursParticipated > 0) {
          contributions[index].totalContribution += remainingDiff > 0 ? 1 : -1;
          contributions[index].shared += remainingDiff > 0 ? 1 : -1;
          remainingDiff += remainingDiff > 0 ? -1 : 1;
        }
        index++;
      }
    }

    return contributions;
  };

  const formatTime = (hour, minute) => {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };

  const contributions = calculateContributions();
  const totalMinutes = calculateTotalMinutes();
  const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-indigo-900 flex items-center justify-center gap-3 mb-2">
            <Clock className="w-8 h-8 text-indigo-600" />
            Chia Tiền Đi Chơi
          </h1>
          <p className="text-indigo-600">Con cặc</p>
        </header>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Thông tin hoạt động */}
          <div className="p-6 border-b border-indigo-100">
            <h2 className="text-xl font-semibold text-indigo-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              Thông tin hoạt động
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian bắt đầu</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={activity.startHour}
                      onChange={(e) => setActivity({ ...activity, startHour: e.target.value })}
                      placeholder="Giờ"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <span className="flex items-center text-gray-500">:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={activity.startMinute}
                      onChange={(e) => setActivity({ ...activity, startMinute: e.target.value })}
                      placeholder="Phút"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian kết thúc</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={activity.endHour}
                      onChange={(e) => setActivity({ ...activity, endHour: e.target.value })}
                      placeholder="Giờ"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <span className="flex items-center text-gray-500">:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={activity.endMinute}
                      onChange={(e) => setActivity({ ...activity, endMinute: e.target.value })}
                      placeholder="Phút"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền/giờ (VND)</label>
                  <input
                    type="number"
                    value={activity.hourlyRate}
                    onChange={(e) => setActivity({ ...activity, hourlyRate: e.target.value })}
                    placeholder="VD: 25000"
                    min="0"
                    step="1000"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chế độ chia chi phí chung</label>
                  <select
                    value={splitMode}
                    onChange={(e) => setSplitMode(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="equal">Chia đều</option>
                    <option value="proportional">Chia theo thời gian tham gia</option>
                  </select>
                </div>
                
                <button
                  type="button"
                  onClick={updateActivity}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium p-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Cập nhật thông tin
                </button>
                
                {totalMinutes > 0 && (
                  <div className="bg-indigo-50 text-indigo-800 p-3 rounded-lg text-center">
                    <p className="font-medium">Tổng thời gian: {(totalMinutes / 60).toFixed(2)} giờ</p>
                    {activity.hourlyRate && (
                      <p className="text-sm mt-1">
                        Tổng chi phí cơ bản: {((totalMinutes / 60) * parseFloat(activity.hourlyRate)).toLocaleString()} VND
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Người tham gia */}
          <div className="p-6 border-b border-indigo-100 bg-gray-50">
            <h2 className="text-xl font-semibold text-indigo-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Người tham gia
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <input
                type="text"
                value={newPerson.name}
                onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
                placeholder="Tên người tham gia"
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={newPerson.joinHour}
                  onChange={(e) => setNewPerson({ ...newPerson, joinHour: e.target.value })}
                  placeholder="Giờ vào"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <span className="flex items-center text-gray-500">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={newPerson.joinMinute}
                  onChange={(e) => setNewPerson({ ...newPerson, joinMinute: e.target.value })}
                  placeholder="Phút"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={newPerson.leaveHour}
                  onChange={(e) => setNewPerson({ ...newPerson, leaveHour: e.target.value })}
                  placeholder="Giờ rời"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <span className="flex items-center text-gray-500">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={newPerson.leaveMinute}
                  onChange={(e) => setNewPerson({ ...newPerson, leaveMinute: e.target.value })}
                  placeholder="Phút"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <button
                type="button"
                onClick={addPerson}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium p-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Thêm người
              </button>
            </div>
            
            {people.length > 0 && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tên</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Giờ tham gia</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Giờ rời</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {people.map((person, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{person.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatTime(person.joinHour, person.joinMinute)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatTime(person.leaveHour, person.leaveMinute)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => removePerson(index)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Khoản chi chung */}
          <div className="p-6 border-b border-indigo-100">
            <h2 className="text-xl font-semibold text-indigo-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-indigo-600" />
              Khoản chi chung
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input
                type="text"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                placeholder="Mô tả khoản chi"
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              
              <input
                type="number"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                placeholder="Số tiền"
                min="0"
                step="1000"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              
              <button
                type="button"
                onClick={addExpense}
                className="bg-amber-500 hover:bg-amber-600 text-white font-medium p-3 rounded-lg transition-all duration-200 flex items-center justify-center"
              >
                <Plus className="w-5 h-5" />
                Thêm khoản chi
              </button>
            </div>
            
            {expenses.length > 0 && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Mô tả</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Số tiền</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {expenses.map((expense, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{expense.description}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {expense.amount.toLocaleString()} VND
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => removeExpense(index)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-amber-50">
                      <td className="px-4 py-3 font-medium text-amber-800">Tổng chi phí</td>
                      <td className="px-4 py-3 font-medium text-amber-800 text-right" colSpan="2">
                        {totalExpense.toLocaleString()} VND
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Kết quả chia tiền */}
          <div className="p-6 bg-indigo-50">
            <h2 className="text-xl font-semibold text-indigo-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Kết quả chia tiền
            </h2>
            
            {contributions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contributions.map((item, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-indigo-900">{item.person}</h3>
                      <span className="text-sm bg-indigo-100 text-indigo-800 py-1 px-2 rounded-full">
                        {item.hoursParticipated.toFixed(2)} giờ
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Chi phí thời gian:</span>
                        <span className="font-medium">{item.participationCost.toLocaleString()} VND</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Chi phí chung:</span>
                        <span className="font-medium">{item.shared.toLocaleString()} VND</span>
                      </div>
                      <div className="border-t pt-2 mt-2 flex justify-between font-medium">
                        <span>Tổng cộng phải trả:</span>
                        <span className="text-indigo-600">{item.totalContribution.toLocaleString()} VND</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg p-8 text-center">
                <Calendar className="w-16 h-16 text-indigo-300 mx-auto mb-4" />
                <p className="text-gray-500">Chưa có đủ dữ liệu để tính toán kết quả chia tiền.</p>
                <p className="text-gray-500 text-sm mt-2">Vui lòng nhập thông tin hoạt động và thêm người tham gia.</p>
              </div>
            )}
          </div>
        </div>
        
        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>© 2025 - Ứng dụng Chia Tiền Đi Chơi</p>
        </footer>
      </div>
    </div>
  );
}

export default App;