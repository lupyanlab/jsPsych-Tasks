import json
import os
import asyncio
import websockets
import logging
import time
from utils.ws_message_type__v1 import MessageType

logging.getLogger().setLevel(logging.INFO)

TASK_NAME = os.path.basename(os.getcwd())

async def hello():
	uri = "ws://localhost:6499"
	while True:
		try:
			async with websockets.connect(uri) as websocket:
				logging.info("Connected to %s", uri)
				await websocket.send(json.dumps({"type": MessageType.REGISTER, "data": TASK_NAME}))
				async for message in websocket:
					await websocket.send("Task received: " + message)
		except Exception as e:
			logging.error("Exception came from websockets: %s", e)
		
		time.sleep(5)
		logging.info("Retrying websocket connection...")

asyncio.get_event_loop().run_until_complete(hello())
asyncio.get_event_loop().run_forever()


# import asyncio
# import websockets
# import logging
# import time

# logging.getLogger().setLevel(logging.INFO)

# async def hello():
# 	uri = "ws://localhost:6499"
# 	while True:
# 		try:
# 			websocket = websockets.connect(uri)
# 			try:
# 				while True:
# 					name = "tone"
# 					logging.info("Connected to %s", uri)
# 					await websocket.send(name)
# 					print(f"> {name}")

# 					greeting = await websocket.recv()
# 					print(f"< {greeting}")
					
# 					await asyncio.sleep(1)
# 			except Exception as e:
# 				logging.error("Exception came from websockets: %s", e)
# 			finally:
# 				webswebsocketocket.close()
# 		except Exception as e:
# 			logging.error("Exception came from websockets: %s", e)
		
# 		await asyncio.sleep(5)
# 		logging.info("Retrying websocket connection...")

# asyncio.get_event_loop().run_until_complete(hello())
# asyncio.get_event_loop().run_forever()
