const Header = () => {
    // const navigate = useNavigate();
    return (
        <div className="flex  justify-between items-center   rounded-lg ">
            <div>
                <h2 className="text-2xl font-semibold text-slate-900 ">OH&S Dashboard</h2>
                <p className="text-sm text-gray-500">
                    ISO 45001 Occupational Health & Safety Management System
                </p>
            </div>

            {/* <div className="flex flex-wrap gap-3">
                <Button onClick={() => navigate('/incidents/report')}
                    leftSection={<IconAlertTriangle size={18} />}

                    color='red'
                    radius="md"
                >
                    Report Incident
                </Button>

                <Button
                    leftSection={<IconShieldCheck size={18} />}

                    color='blue'
                    radius="md"

                >
                    Risk Assessment
                </Button>

                <Button
                    leftSection={<IconEye size={18} />}

                    color='green'
                    radius="md"

                >
                    Safety Observation
                </Button>
            </div> */}
        </div >
    )
}

export default Header