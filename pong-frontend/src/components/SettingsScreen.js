import React, { useState } from "react";

function SettingsScreen() {
	const [soundOn, setSoundOn] = useState(true);
	const [graphicsOn, setGraphicsOn] = useState(true);

	return (
		<div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">
			<div className="p-8 bg-gray-800 rounded-lg shadow-lg w-full max-w-lg text-center">
				<h1 className="text-4xl font-bold mb-4 text-blue-400">Settings</h1>
				<div className="space-y-6">
					{/* Sound Toggle */}
					<div className="flex justify-center items-center">
						<span className="text-lg bold pr-3">Sound</span>
						<label className="relative inline-flex items-center cursor-pointer">
							<input 
								type="checkbox" 
								checked={soundOn} 
								onChange={() => setSoundOn(!soundOn)} 
								className="sr-only peer" 
							/>
							<div className="w-11 h-6 bg-gray-400 rounded-full peer-checked:bg-blue-500 peer-focus:ring-2 peer-focus:ring-blue-500"></div>
							<span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></span>
						</label>
					</div>

					{/* Graphics Toggle */}
					<div className="flex justify-center items-center">
						<span className="text-lg bold pr-3">Graphics</span>
						<label className="relative inline-flex items-center cursor-pointer">
							<input 
								type="checkbox" 
								checked={graphicsOn} 
								onChange={() => setGraphicsOn(!graphicsOn)} 
								className="sr-only peer" 
							/>
							<div className="w-11 h-6 bg-gray-400 rounded-full peer-checked:bg-blue-500 peer-focus:ring-2 peer-focus:ring-blue-500"></div>
							<span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></span>
						</label>
					</div>
				</div>
				<div className="mt-6 flex justify-between items-center">
					<div>
						<button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">
							Save
						</button>
					</div>
					<div>
						<button className="text-red-500 hover:text-red-600 font-semibold">
							Cancel
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

export default SettingsScreen;
