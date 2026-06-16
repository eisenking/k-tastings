import ActivityTabContent from "./ActivityTabContent";

export default function ActivityTab() {
    return (
        <div className="w-full mt-4">
            <h2 className="text-xl font-semibold mb-4">Журнал активности</h2>
            <ActivityTabContent />
        </div>
    );
}